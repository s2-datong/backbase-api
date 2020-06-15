const {getCollection} = require('../db');
const crypto = require('crypto');
const ObjectID = require('mongodb').ObjectID;
const config = require('../../config');
const {DB_ORG, DB_USER, DB_TEAM, DB_WORKSPACE,
DB_WORKSPACE_MEMBERS, DB_CHANNEL, DB_RULE, DB_PLANS,
DB_AVAILABLE_SUBSCRIPTIONS} = require('../Constants');
const {RedisService} = require('../services');
const SubscribeOrganizationToFreePlan = require('./Subscription').subscribeOrgToFreePlan;

class Bootstrap{
    static async runBootstrap(){
        process.on('uncauthException', (err) => {
            console.log(err);
            process.exit(1);
        });
        // create backbase org if it doesn't exist
        const orgColl = await getCollection(DB_ORG);
        const _org = await orgColl.findOne({backbase_app: true});
        if(!_org){
            // create backbase org
            const org = {
                _id: new ObjectID(),
                name: "Backbase",
                createdBy: 'system',
                api_key: {
                    public: config.app.backbase_org.public_key,
                    secret: config.app.backbase_org.secret_key
                },
                workspace_count: 1,
                user_count: 1,
                dateCreated: new Date(),
                dateUpdated: new Date(),
                backbase_app: true,
                system: true
            };
            await orgColl.insertOne(org);
            await SubscribeOrganizationToFreePlan(org._id);

            // create admin user
            const userColl = await getCollection(DB_USER);
            const hash = crypto.createHash('SHA256');
            hash.update(config.app.backbase_org.admin_user.password);

            //

            const user = {
                _id: new ObjectID(),
                firstname: config.app.backbase_org.admin_user.first_name, 
                lastname: config.app.backbase_org.admin_user.last_name, 
                email: config.app.backbase_org.admin_user.email, 
                password: hash.digest('hex'),
                email_verified: true,
                photo: {
                    url: config.app.default_user_photo,
                    id: 'none'
                },
                dateCreated: new Date(),
                dateUpdated: new Date(),
                default_organization: org._id
            };

            await userColl.insertOne(user);
            

            // add admin user as org owner and admin of org
            const teamColl = await getCollection(DB_TEAM);
            const team = {
                user: user._id,
                organization: org._id,
                joined: new Date(),
                status: 'active',
                org_owner: true,
                admin: true
            };
            await teamColl.insertOne(team);

            // create workspace for org
            const workspaceColl = await getCollection(DB_WORKSPACE);
            const workspaceMemberColl = await getCollection(DB_WORKSPACE_MEMBERS);

            const workspace = {
                _id: new ObjectID(),
                name: "Backbase Workspace",
                description: "Default workspace",
                createdBy: user._id,
                timestamp: new Date(),
                channel_count: 5,
                function_count: 0,
                constants_count: 0,
                organization: org._id
            };
            const member = {
                user: user._id,
                workspace: workspace._id,
                organization: user.organization,
                workspace_admin: true,
                workspace_owner: true,
                joined: new Date()
            };

            await workspaceColl.insertOne(workspace);
            await workspaceMemberColl.insertOne(member);

            // create channel and rules
            const channelColl = await getCollection(DB_CHANNEL);
            const ruleCol = await getCollection(DB_RULE);

            const channel_rules = require('../util/Bootstrap');
            for(let i = 0; i < channel_rules.length; i++){
                const channelRule = channel_rules[i];
                const channelName = channelRule.name;
                const channelSlug = channelName.replace(/ /g, '_').trim().toLowerCase();
                const _rules = channelRule.rules;

                const channel = {
                    _id: new ObjectID(),
                    name: channelName,
                    slug: channelSlug,
                    description: channelName,
                    createdBy: user._id,
                    workspace: workspace._id,
                    rule_count: 0,
                    organization: org._id,
                    timestamp: new Date()
                };

                for(let j = 0; j < _rules.length; j++){
                    const _rule = _rules[j];
                    const rule = {
                        channel: channel._id,
                        workspace: workspace._id,
                        rule: _rule,
                        index: j,
                        title: `Rule ${j}`,
                        description: `Rule ${j}`,
                        createdBy: user._id,
                        timestamp: new Date()
                    };

                    await ruleCol.insertOne(rule);
                    // Set redis key for rule
                    await RedisService.saveChannelRule(
                        org._id.toString(), workspace._id.toString(), 
                        channelSlug, _rule, j
                    );
                }

                await channelColl.insertOne(channel);
                // Set redis key for channel
                await RedisService.saveChannel(
                    org._id.toString(),
                    workspace._id.toString(), channelSlug
                );
            }

            // Set Redis Key for organization
            await RedisService.saveOrgAPIKey(org._id.toString(), org.api_key.public, true);
            await RedisService.saveNewOrganization(org._id.toString());
        }

        const plans = 
        [
            // FREE PLAN
            {
                _id: 'free',
                display: 'Free Subscription plan',
                description: 'All organizations start on this plan',
                stripe_plan_id: null,
                scoped_to_organization: false,
                amount: 0,
                currency: 'USD',
                interval: 'monthly'
            },

            // STARTUP PLAN
            {
                _id: 'startup',
                display: 'StartUp Subscription plan',
                description: 'For startups and Small businesses',
                stripe_plan_id: 'plan_HAWO6gMek4Zc6P',
                scoped_to_organization: false,
                amount: 20,
                currency: 'USD',
                interval: 'monthly'
            },

            // STANDARD PLAN
            {
                _id: 'standard',
                display: 'Standard Subscription plan',
                description: 'Medium sized businesses with 20 or more staffs',
                stripe_plan_id: 'plan_HAWPvESn1BU4FF',
                scoped_to_organization: false,
                amount: 100,
                currency: 'USD',
                interval: 'monthly'
            },

            // ENTERPRISE PLAN
            {
                _id: 'enterprise',
                display: 'Enterprise Subscription plan',
                description: 'Large Enterprises with 50 staffs or more',
                stripe_plan_id: 'plan_HAWPVrT2Kn70pM',
                scoped_to_organization: false,
                amount: 500,
                currency: 'USD',
                interval: 'monthly',
                usage_based: false,
            },

            // USER PLAN
            {
                _id: 'user',
                display: 'Seats Subscription plan',
                description: `Usage based plan. Add user seats as you like to your organization.
                Subscription is charged per user per month`,
                stripe_plan_id: 'plan_HEu49UJR7EeJFZ',
                scoped_to_organization: false,
                amount: 10,
                currency: 'USD',
                interval: 'monthly',
                usage_based: true,
                usage_description: '$10 / User / Month'
            }
        ];

        const availableSubscriptions = [
            {
                _id: 'free',
                name: 'Free Subscription',
                plans: [plans[0]._id],
                scoped_to_organization: false,
                description: '',
                index: 1,
                active: false
            },
            {
                _id: 'startup',
                name: "StartUp Subscription",
                plans: [plans[1]._id],
                scoped_to_organization: false,
                description: '',
                index: 2,
                active: true
            },
            {
                _id: 'standard',
                name: "Standard Subscription",
                plans: [plans[2]._id],
                scoped_to_organization: false,
                description: '',
                index: 3,
                active: true
            },
            {
                _id: 'enterprise',
                name: "Enterprise Subscription",
                plans: [plans[3]._id],
                scoped_to_organization: false,
                description: '',
                index: 4,
                active: true
            }
        ];

        // Create default Subscription Plans
        const planColl = await getCollection(DB_PLANS);
        const availableSubsColl = await getCollection(DB_AVAILABLE_SUBSCRIPTIONS);

        await planColl.insertMany(plans);
        await availableSubsColl.insertMany(availableSubscriptions);
    }
}

module.exports = Bootstrap;