const {getCollection} = require('../db');
const {DB_PLANS, DB_TEAM, DB_SUBSCRIPTION, DB_AVAILABLE_SUBSCRIPTIONS} = require('../Constants');
const config = require('../../config');
const stripe = require('stripe')(config.service.payment.stripe.secret_key);

class UserBillingService{
    static async TotalOrgUsersChanged(org_id){
        const planColl = await getCollection(DB_PLANS);
        const userPlan = await planColl.findOne({_id: 'user'});
        const stripe_plan_id = await userPlan.stripe_plan_id;

        const subColl = await getCollection(DB_SUBSCRIPTION);
        const availSubColl = await getCollection(DB_AVAILABLE_SUBSCRIPTIONS);

        const current_subscription = await subColl.findOne({organization: org_id});
        const systemSubscription = await availSubColl.findOne({_id: current_subscription.subscription_id});

        // free plan does not charge for users
        if(current_subscription.subscription_id === 'free') return;

        const teamColl = await getCollection(DB_TEAM);
        const totalUsers = await teamColl.countDocuments({
            organization: org_id
        });

        let freeUsers = config.app.free_users;
        // allow free users count to be overridden by each subscription plan 
        if(systemSubscription.free_users && Number.isInteger(systemSubscription.free_users)){
            freeUsers = systemSubscription.free_users;
        }

        // finally super admin should be able to set free users limit on each
        // organization's active subscription per organization
        if(current_subscription.free_users && Number.isInteger(current_subscription.free_users)){
            freeUsers = current_subscription.free_users;
        }

        const totalBillableUsers = totalUsers - freeUsers;

        if(totalBillableUsers < 1){
            // this means I shouldn't be charged for my users because they are free seats
            // but what if I had users above free user limit
            // and then removed users to fallback into the free user
            // bracket

            // to handle this scenario, 
            // get my subscription items and see if I have a subscription
            // for the 'user' plan with a quantity of 1 or above

            // if this is the case remove the subscription item

            const subscriptionItems = await stripe.subscriptionItems.list({
                subscription: stripe_subscription_id
            });
            if(subscriptionItems.data && Array.isArray(subscriptionItems.data)){
                const planItem = subscriptionItems.data.find(item => item.plan.id === stripe_plan_id);
                if(planItem){
                    if(planItem.quantity >= 1){
                        await stripe.subscriptionItems.del(planItem.id);
                    }
                }
            }

            return;
        }

        const stripe_subscription_id = current_subscription.stripe_subscription_id;
        await stripe.subscriptions.update(
            stripe_subscription_id,
            { items: [{
                plan: stripe_plan_id,
                quantity: totalBillableUsers
            }] }
        );
    }
}

module.exports = UserBillingService;