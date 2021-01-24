const {getCollection} = require('../db');
const config = require('../../config');
const {DB_AVAILABLE_SUBSCRIPTIONS, DB_SUBSCRIPTION, DB_ORG, DB_PLANS, DB_BANK, DB_CARDS} = require('../Constants');
const stripe = require('stripe')(config.service.payment.stripe.secret_key);
const {OperationNotAllowedException, ApplicationError, FundingSourceRequiredException} = require('../exceptions');
const {RedisService, BusinessRulesService, EmailService} = require('../services');

async function switchStripePlans(current_subscription_id, newPlanStripeId, userStripePlanId){
    // so to upgrade or downgrade, you actually need to pass the
    // subscriptionItem Id of a subscription item and the new plan Code
    // that the subscription Item should be upgraded or downgraded to
    const subscription = await stripe.subscriptions.retrieve(current_subscription_id);
    const subscriptionItems = subscription.items.data;
    const subscriptionItemsNoUser = subscriptionItems.filter(sub => sub.plan !== userStripePlanId);
    if(Array.isArray(subscriptionItemsNoUser) && subscriptionItemsNoUser.length > 0){
        const item = subscriptionItemsNoUser[0];
        await stripe.subscriptions.update(current_subscription_id, {
            items: [{
                id: item.id,
                plan: newPlanStripeId,
            }]
        });
    }else{
        const err = new Error("Could not update subscription");
        err.subscription_id = current_subscription_id;
        err.subscriptionItems = subscriptionItems;
        throw err;
    }

    return;
}

class Subscription {
    static async subscribeOrgToFreePlan(org_id){
        // internal method, called when org is created
        const subColl = await getCollection(DB_SUBSCRIPTION);
        const alreadySubscribed = await subColl.findOne({
            organization: org_id
        });

        if(alreadySubscribed) return;

        const date = new Date();
        const subscription = {
            organization: org_id,
            subscription_id: 'free',
            active: true,
            created: date,
            updated: date
        };

        await subColl.insertOne(subscription);
    } 

    static async getCurrentSubscriptionForOrg(user, orgTeamUser){
        const subColl = await getCollection(DB_SUBSCRIPTION);
        const subscription = await subColl.findOne({
            organization: user.organization
        });

        const availableSubscriptionsColl = await getCollection(DB_AVAILABLE_SUBSCRIPTIONS);
        const systemSubscription = await availableSubscriptionsColl.findOne({
            _id: subscription.subscription_id
        });

        const _subscription = {
            id: subscription._id.toString(),
            name: systemSubscription.name,
            description: systemSubscription.description,
            custom: systemSubscription.scoped_to_organization
        };

        return {subscription: _subscription};
    }

    static async getAvailableSubscriptionPlans(user){
        let where;
        if(user && user.organization){
            where = {
                $or: [
                    {scoped_to_organization: false, active: true},
                    {scoped_to_organization: true, organization: user.organization, active: true}
                ]
            };
        }else{
            where = {scoped_to_organization: false, active: true};
        }

        const availableSubColl = await getCollection(DB_AVAILABLE_SUBSCRIPTIONS);
        const subscriptions = await availableSubColl.find(where).sort({index: 1}).toArray();
        const _subscriptions = subscriptions.map(sub => ({
            id: sub._id,
            name: sub.name,
            description: sub.description,
            custom: sub.scoped_to_organization
        }));

        return {
            subscriptions: _subscriptions
        };
    }

    static async subscribeOrgToNewPlan(user, orgTeamUser, available_subscription_id){
        const orgColl = await getCollection(DB_ORG);
        const subColl = await getCollection(DB_SUBSCRIPTION);
        const availableSubColl = await getCollection(DB_AVAILABLE_SUBSCRIPTIONS);
        const planColl = await getCollection(DB_PLANS);

        const bankColl = await getCollection(DB_BANK);
        const cardColl = await getCollection(DB_CARDS);

        const bcount = await bankColl.countDocuments({organization: user.organization});
        const ccount = await cardColl.countDocuments({organization: user.organization});
        const totalCount = bcount + ccount;
        if(totalCount === 0) throw new FundingSourceRequiredException();


        //only org_owner or org_admin
        if(orgTeamUser.admin !== true) throw new OperationNotAllowedException();

        const organization = await orgColl.findOne({_id: user.organization});
        const org_stripe_customer_id = organization.stripe_customer;
        const current_subscription = await subColl.findOne({organization: organization._id});
        const org_subscription = await availableSubColl.findOne({_id: current_subscription.subscription_id});

        const subscription_to_move_to = await availableSubColl.findOne({_id: available_subscription_id});
        if(!subscription_to_move_to) throw new ApplicationError("Invalid subscription Id provided");
        const subscription_to_move_to_planIds = subscription_to_move_to.plans;
        const subscription_to_move_to_plans = await planColl.find({_id: {$in: subscription_to_move_to_planIds}}).toArray();

        const userPlan = await planColl.findOne({_id: 'user'});

        // You cannot subscribe to the same plan you are currently on
        if(available_subscription_id === current_subscription.subscription_id) throw new ApplicationError("You are already on this subscription plan");
        // determine if subscription update is a downgrade
        // ie moving from a subscription with a higher index to a subscription with a lower index
        let isDowngrade = false;
        if(org_subscription.index > subscription_to_move_to.index) isDowngrade = true;

        if(isDowngrade === true){
            const orgUsage = await RedisService.getOrgUsage(organization._id.toString());
            const payload = BusinessRulesService.OrgUsageToBusinessRulesPayload(orgUsage);

            // determine channel to send to
            let channel = '';
            if(current_subscription.subscription_id === 'enterprise') channel = "downgrade_from_enterprise";
            if(current_subscription.subscription_id === 'standard') channel = "downgrade_from_standard";
            // Custom downgrade channel is expected to be created with custom subscription
            if(org_subscription.scoped_to_organization === true) channel = `downgrade_from_${current_subscription.subscription_id}`;
            // you cannot downgrade from startup to free, you need to cancel your subscription to do that
            
            // run business rules on downgrade action
            // return error if downgrade not possible
            if(channel !== ''){
                payload.channel = channel;
                await BusinessRulesService.RunThroughBackbase(payload);
            }
        }
        
        // check date subscription was last updated
        let lastUpdated = current_subscription.updated;
        let _now = new Date();
        let one_day_timestamp = 60 * 60 * 24 * 1000;
        // you can only update your subscription once every day
        if(_now - lastUpdated < one_day_timestamp && (current_subscription.updated - current_subscription.created !== 0)) throw new ApplicationError("Error. For security and performance sake, you can only update your subscription once a day");

        const stripe_plan_ids_for_subscription_items = subscription_to_move_to_plans.map(s => ({plan: s.stripe_plan_id}));
        if(current_subscription.subscription_id === 'free'){
            const _stripe_subscription = await stripe.subscriptions.create(
                {
                customer: org_stripe_customer_id,
                items: stripe_plan_ids_for_subscription_items,
                }
            );
            await subColl.updateOne({organization: organization._id}, {$set: {
                stripe_subscription_id: _stripe_subscription.id,
                subscription_id: available_subscription_id,
                updated: new Date()
            }});
        }else{
            const _stripe_subscription_id = current_subscription.stripe_subscription_id;

            await switchStripePlans(
                _stripe_subscription_id, subscription_to_move_to_plans[0].stripe_plan_id,
                userPlan.stripe_plan_id
            );
            
            await subColl.updateOne({organization: organization._id}, {$set: {
                subscription_id: available_subscription_id,
                updated: new Date()
            }});
        }
        await RedisService.updateOrgPlan(organization._id.toString(), available_subscription_id);

        // send email, subscription updated
        await EmailService.SubscriptionUpdated(user.email, user.firstname, org_subscription.name, subscription_to_move_to.name);

        return {
            message: `Your subscription has been updated.`,
            messages: [
                `Your subscription has been updated.`,
                `Your subscription is automatically prorated by Stripe`,
                `Please note that you may or may not get an invoice immediately`,
                `If you have any questions please contact subscriptions@backbase.co`
            ]
        }

    }

    static async cancelSubscription(user, orgTeamUser){
        // takes you back to the free plan
        if(orgTeamUser.admin !== true) throw new OperationNotAllowedException();

        const orgColl = await getCollection(DB_ORG);
        const subColl = await getCollection(DB_SUBSCRIPTION);
        const availableSubColl = await getCollection(DB_AVAILABLE_SUBSCRIPTIONS);
        const org_id = user.organization.toString();

        const organization = await orgColl.findOne({_id: user.organization});
        const current_subscription = await subColl.findOne({organization: organization._id});
        const org_subscription = await availableSubColl.findOne({_id: current_subscription.subscription_id});
        if(current_subscription.subscription_id === 'free') throw new ApplicationError("You cannot cancel a free subscription plan");

        // cancellation is always a downgrade
        // run business rules on downgrade action
        const orgUsage = await RedisService.getOrgUsage(org_id);
        const payload = BusinessRulesService.OrgUsageToBusinessRulesPayload(orgUsage);

        // which channel should I send payload to
        let channel = '';
        if(current_subscription.subscription_id === 'enterprise') channel = "downgrade_from_enterprise";
        if(current_subscription.subscription_id === 'standard') channel = "downgrade_from_standard";
        if(current_subscription.subscription_id === 'startup') channel = "downgrade_from_startup";
        // Custom downgrade channel is expected to be created with custom subscription
        if(org_subscription.scoped_to_organization === true) channel = `downgrade_from_${current_subscription.subscription_id}`;

        if(channel !== ''){
            payload.channel = channel;
            await BusinessRulesService.RunThroughBackbase(payload);
        }

        // check date subscription was last updated
        // you can only update or cancel your subscription once every week
        let lastUpdated = current_subscription.updated;
        const _now = new Date();
        const one_day_timestamp = 60 * 60 * 24 * 1000;
        // you can only update your subscription once every week
        if(_now - lastUpdated < one_day_timestamp && (current_subscription.updated - current_subscription.created !== 0)) throw new ApplicationError("Error. For security and performance sake, you can only update/cancel your subscription once every day");
        
        
        const _stripe_subscription_id = current_subscription.stripe_subscription_id;

        await stripe.subscriptions.del(_stripe_subscription_id);

        // send email that subscription has been cancelled
        await EmailService.SubscriptionCancelled(user.email);

        await subColl.updateOne({_id: current_subscription._id}, {$set: {
            subscription_id: 'free',
            updated: new Date()
        }, $unset: {stripe_subscription_id: 1}});

        await RedisService.updateOrgPlan(organization._id.toString(), 'free');

        return {
            message: `Your subscription has been cancelled.`,
            messages: [
                `Your subscription has been cancelled.`,
                `Any pending invoices still need to be paid at their due date`,
                `Pending invoices are automatically prorated by stripe`,
                `If you have any questions please contact subscriptions@backbase.co`
            ]
        }
    }
}

module.exports = Subscription;