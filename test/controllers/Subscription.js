// get current subscriptions, get available plans, 
// update subscription, with no card - fail
// update subscription with default card
// update subscription twice - fail once a week/day
// move date backward - upgrade subscription again
// downgrade subscription
// cancel subscription

const accountController = require('../../app/controllers/Account');
const subscriptionController = require('../../app/controllers/Subscription');
const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_SUBSCRIPTION} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');

const session = {};

describe('Subscription', function(done){
    this.timeout(6000);
    before( function(done){
        accountController.login(
            "bbase_user1_test@mailinator.com",
            "new_password"
        ).then(login => {
            session.token = login.token;
            done();
        });
    });

    describe('Subscription', function(){
        it('Cannot cancel free plan subscription', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.rejects(
                subscriptionController.cancelSubscription(user, orgTeamUser),
                ApplicationError
            );
        });

        it('should return free plan as current subscription', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const subscription = await subscriptionController.getCurrentSubscriptionForOrg(user, orgTeamUser);
            assert.strictEqual(subscription.subscription.name, "Free Subscription");
        });

        it('should return available subscription plans', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const availableSubs = await subscriptionController.getAvailableSubscriptionPlans(
                user
            );

            if(Array.isArray(availableSubs.subscriptions) && availableSubs.subscriptions.length === 3){}
            else{ assert.fail("Expected 3 available subscriptions"); }
        });

        it('Should subscribe organization to startup plan', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.doesNotReject(
                subscriptionController.subscribeOrgToNewPlan(
                    user, orgTeamUser, 'startup'
                )
            );
        });

        it('Cannot subscribe to the same plan', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.rejects(
                subscriptionController.subscribeOrgToNewPlan(
                    user, orgTeamUser, 'startup'
                ),
                new ApplicationError("You are already on this subscription plan")
            );
        });

        it('should not allow updating subscription many times per day', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.rejects(
                subscriptionController.subscribeOrgToNewPlan(
                    user, orgTeamUser, 'standard'
                ),
                new ApplicationError("Error. For security and performance sake, you can only update your subscription once a day")
            );
        });

        it('should update subscription to standard plan after 1 day passes', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const subColl = await getCollection(DB_SUBSCRIPTION);
            const currentSub = await subColl.findOne({organization: user.organization});
            const date = new Date();
            date.setDate(date.getDate() - 2);
            await subColl.updateOne({_id: currentSub._id}, {$set: {updated: date}});

            await assert.doesNotReject(
                subscriptionController.subscribeOrgToNewPlan(user, orgTeamUser, 'standard')
            );
        });

        it('should downgrade subscription to startup plan after 1 day passes', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const subColl = await getCollection(DB_SUBSCRIPTION);
            const currentSub = await subColl.findOne({organization: user.organization});
            const date = new Date();
            date.setDate(date.getDate() - 2);
            await subColl.updateOne({_id: currentSub._id}, {$set: {updated: date}});

            await assert.doesNotReject(
                subscriptionController.subscribeOrgToNewPlan(user, orgTeamUser, 'startup')
            );
        });

        it('should not cancel subscription within 1 day of update', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.rejects(
                subscriptionController.cancelSubscription(user, orgTeamUser),
                new ApplicationError("Error. For security and performance sake, you can only update/cancel your subscription once every day")
            );
        });

        it('should cancel subscription after 1 day passes', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const subColl = await getCollection(DB_SUBSCRIPTION);
            const currentSub = await subColl.findOne({organization: user.organization});
            const date = new Date();
            date.setDate(date.getDate() - 2);
            await subColl.updateOne({_id: currentSub._id}, {$set: {updated: date}});

            await assert.doesNotReject(
                subscriptionController.cancelSubscription(user, orgTeamUser)
            );
        });
    });
});