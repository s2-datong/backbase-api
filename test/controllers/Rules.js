const accountController = require('../../app/controllers/Account');
const rulesController = require('../../app/controllers/Rule');
const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_RULE, DB_WORKSPACE, DB_CHANNEL} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');

const session = {token: ""};

describe('Rules', function(done){
    this.timeout(6000);
    before( function(done){
        accountController.login(
            "bbase_user4_test@mailinator.com",
            "new_password"
        ).then(login => {
            session.token = login.token;
            done();
        });
    });

    describe('Rule actions', function(){
        it('should list 0 rules', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rules = await rulesController.listRules(user, orgTeamUser, ws._id.toString(), chn._id.toString());

            if(!Array.isArray(rules.rules)) assert.fail("Expected rules array");
            assert.strictEqual(rules.rules.length, 0, "Expected 0 rules");

        });

        it('should create rule', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rule = "if size == 1 then set total = 5";
            await assert.doesNotReject(
                rulesController.createRule(user, orgTeamUser, ws._id.toString(), chn._id.toString(), rule, 1, "simple rule", "rule description")
            );
        });

        it('should create 3 rules', async function(){
            this.timeout(10000);
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rule1 = "if size == 1 then set total = 5";
            const rule2 = "if size == 2 then set total = 15";
            const rule3 = "if size == 3 then set total = 20";

            await rulesController.createRule(user, orgTeamUser, ws._id.toString(), chn._id.toString(), rule1, 4, "simple rule 2", "rule description");
            await rulesController.createRule(user, orgTeamUser, ws._id.toString(), chn._id.toString(), rule2, 2, "simple rule 3", "rule description");
            await rulesController.createRule(user, orgTeamUser, ws._id.toString(), chn._id.toString(), rule3, 3, "simple rule 4", "rule description");
        });

        it('cannot create rule with already existing index', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});
            const rule3 = "if size == 3 then set total = 20";

            await assert.rejects(
                rulesController.createRule(user, orgTeamUser, ws._id.toString(), chn._id.toString(), rule3, 3, "simple rule 4", "rule description"),
                ApplicationError
            );
        });

        it('should list 4 rules', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rules = await rulesController.listRules(user, orgTeamUser, ws._id.toString(), chn._id.toString());

            if(!Array.isArray(rules.rules)) assert.fail("Expected rules array");
            assert.strictEqual(rules.rules.length, 4, "Expected 4 rules");
        });

        it('should update 2nd rule', async function(){
            this.timeout(10000);
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rulecol = await getCollection(DB_RULE);
            const rule2 = await rulecol.findOne({title: "simple rule 2"});

            await assert.doesNotReject(
                rulesController.updateRule(user, orgTeamUser, ws._id.toString(), chn._id.toString(), rule2._id.toString(), null, null, "new title", "new description")
            );

            const _rule2 = await rulecol.findOne({title: "new title"});
            assert.strictEqual(_rule2._id.toString(), rule2._id.toString(), "Expected same rule 2");
            
            const new_rule = "if name == 5 then set safe = 1";
            await assert.doesNotReject(
                rulesController.updateRule(user, orgTeamUser, ws._id.toString(), chn._id.toString(), rule2._id.toString(), new_rule, 7, null, null)
            );

        });

        it('should delete 3rd rule', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rulecol = await getCollection(DB_RULE);
            const rule3 = await rulecol.findOne({title: "simple rule 3"});

            await assert.doesNotReject(
                rulesController.deleteRule(user, orgTeamUser, ws._id.toString(), chn._id.toString(), rule3._id.toString())
            );
        });

        it('should list 3 rules', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rules = await rulesController.listRules(user, orgTeamUser, ws._id.toString(), chn._id.toString());

            if(!Array.isArray(rules.rules)) assert.fail("Expected rules array");
            assert.strictEqual(rules.rules.length, 3, "Expected 3 rules");
        });

        it('should return used rule index as invalid', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const result = await rulesController.isRuleIndexValid(user, orgTeamUser, ws._id.toString(), chn._id.toString(), 7);
            assert.strictEqual(result.valid, false);
        });

        it('should return index 8 as the next valid index', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const result = await rulesController.returnNextValidRuleIndex(user, orgTeamUser, ws._id.toString(), chn._id.toString());
            assert.strictEqual(result.index, 8);
        });
    });
});