const accountController = require('../../app/controllers/Account');
const workspaceAdminController = require('../../app/controllers/WorkspaceAdmin');
const workspaceController = require('../../app/controllers/Workspace');
const channelController = require('../../app/controllers/Channel');
const rulesController = require('../../app/controllers/Rule');
const functionsController = require('../../app/controllers/Functions');
const variablesController = require('../../app/controllers/Variables');
const pollingjobController = require('../../app/controllers/PollingJob');

const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_WORKSPACE, DB_CHANNEL, DB_RULE,
DB_FUNCTIONS, DB_VARIABLES, DB_POLLING_JOB} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');
const { ObjectID } = require('mongodb');

const session = {token: ""};

describe('Workspace Admin', function(done){
    this.timeout(6000);
    before( function(done){
        accountController.login(
            "bbase_user4_test@mailinator.com",
            "new_password"
        ).then(login => {
            session.token = login.token;
            console.log(login.user.organization.name);
            done();
        });
    });

    describe('Locking/Unlocking workspace', function(){
        // 
        it('should lock workspace 1', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.doesNotReject(
                workspaceAdminController.LockWorkspace(user, orgTeamUser, ws._id.toString())
            );
        });

        it('cannot update workspace 1 info when locked', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.rejects(
                workspaceController.updateWorkspace(user, orgTeamUser, ws._id.toString(), "New Workspace", "desc"),
                ApplicationError
            );
        });

        it('cannot create/update/delete channel in workspace 1 when locked', async function(){
            this.timeout(12000);
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            await assert.rejects(
                channelController.createChannel(
                    user, orgTeamUser, ws._id.toString(),
                    "channel 2", "channel description"
                ),
                ApplicationError
            );

            await assert.rejects(
                channelController.updateChannel(
                    user, orgTeamUser, ws._id.toString(),
                    chn._id.toString(), "New channel", "channel description"
                ),
                ApplicationError
            );

            await assert.rejects(
                channelController.deleteChannel(
                    user, orgTeamUser, ws._id.toString(),
                    chn._id.toString()
                ),
                ApplicationError
            );
        });

        it('cannot create/update/delete rule in channel in workspace when locked', async function(){
            this.timeout(12000);
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rulecol = await getCollection(DB_RULE);
            const rule = await rulecol.findOne({title: "simple rule"});
            const ruleId = rule._id.toString();

            await assert.rejects(
                rulesController.createRule(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString(),
                    "if count == 2 then set total = 1", 11, "strange rule", "strange rule"
                ),
                ApplicationError
            );

            await assert.rejects(
                rulesController.updateRule(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString(),
                    ruleId, null, 12, "same rule", ""
                ),
                ApplicationError
            );

            await assert.rejects(
                rulesController.deleteRule(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString(),
                    ruleId
                ),
                ApplicationError
            );
        });

        // todo function, variable, polling job
        it('cannot create/edit/delete functions in workspace 1 while locked', async function(){
            this.timeout(12000);
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcColl = await getCollection(DB_FUNCTIONS);
            const func = await funcColl.findOne({name: 'hellotoo'});
            const func_id = func._id.toString();

            const funcString = `
                function hellomee(){
                    return "hello you";
                }
            `;

            await assert.rejects(
                functionsController.createFunction(
                    user, orgTeamUser, funcString, "desc", ws._id.toString()
                ),
                ApplicationError
            );

            await assert.rejects(
                functionsController.updateFunction(
                    user, orgTeamUser, func_id, funcString, "desc", ws._id.toString()
                ),
                ApplicationError
            );

            await assert.rejects(
                functionsController.deleteFunction(
                    user, orgTeamUser, 'hellotoo', ws._id.toString()
                ),
                ApplicationError
            );
        });

        it('cannot create/edit/delete variables in workspace 1 while locked', async function(){
            this.timeout(12000);
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const varColl = await getCollection(DB_VARIABLES);
            const varOne = await varColl.findOne({name: "MAX_USERS"});

            await assert.rejects(
                variablesController.createVariable(
                    user, orgTeamUser, "MINI_MAX", "Salvation", "desc", ws._id.toString()
                ),
                ApplicationError
            );

            await assert.rejects(
                variablesController.updateVariableValue(
                    user, orgTeamUser, "MAX_USERS", 400, "desc", ws._id.toString()
                ),
                ApplicationError
            );

            await assert.rejects(
                variablesController.deleteVariable(
                    user, orgTeamUser, "MAX_USERS", ws._id.toString()
                ),
                ApplicationError
            );
        });

        it('cannot create/edit/delete polling jobs in workspace 1 while locked', async function(){
            this.timeout(12000);
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const pollColl = await getCollection(DB_POLLING_JOB);
            const pollJob = await pollColl.findOne({name: "poll2"});
            const pollid = pollJob._id.toString();

            await assert.rejects(
                pollingjobController.createPollingJob(
                    user, orgTeamUser, ws._id.toString(),
                    "pollme", "desc", "", "", "secret",
                    chn._id.toString(), "every 3 minutes", "simple"
                ),
                ApplicationError
            );

            await assert.rejects(
                pollingjobController.updatePollingJob(
                    user, orgTeamUser, ws._id.toString(), pollid,
                    "pollme", "desc", null, null, "secret"
                ),
                ApplicationError
            );

            await assert.rejects(
                pollingjobController.deletePollingJob(
                    user, orgTeamUser, ws._id.toString(), pollid
                ),
                ApplicationError
            );
        });

        it('should unlock workspace 1', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.doesNotReject(
                workspaceAdminController.UnlockWorkspace(
                    user, orgTeamUser, ws._id.toString()
                )
            );
        });
    });

    describe('Locking/unlocking channel', function(){
        it('should lock channel', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            await assert.doesNotReject(
                workspaceAdminController.LockChannel(user, orgTeamUser, ws._id.toString(), chn._id.toString())
            );
        });

        it('cannot update channel info while locked', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            await assert.rejects(
                channelController.updateChannel(
                    user, orgTeamUser, ws._id.toString(),
                    chn._id.toString(), "New channel", "channel description"
                ),
                ApplicationError
            );
        });

        it('cannot delete channel while locked', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            await assert.rejects(
                channelController.deleteChannel(
                    user, orgTeamUser, ws._id.toString(),
                    chn._id.toString()
                ),
                ApplicationError
            );
        });

        it('cannot create/update/delete rule in channel while locked', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            const rulecol = await getCollection(DB_RULE);
            const rule = await rulecol.findOne({title: "simple rule"});
            const ruleId = rule._id.toString();

            await assert.rejects(
                rulesController.createRule(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString(),
                    "if count == 2 then set total = 1", 11, "strange rule", "strange rule"
                ),
                ApplicationError
            );

            await assert.rejects(
                rulesController.updateRule(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString(),
                    ruleId, null, 12, "same rule", ""
                ),
                ApplicationError
            );

            await assert.rejects(
                rulesController.deleteRule(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString(),
                    ruleId
                ),
                ApplicationError
            );
        });

        it('should unlock channel', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            await assert.doesNotReject(
                workspaceAdminController.UnlockChannel(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString()
                )
            );
        });
    });

    describe('Locking/unlocking rule', function(){
        it('should lock rule', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const rulecol = await getCollection(DB_RULE);
            const rule = await rulecol.findOne({title: "simple rule"});
            const ruleId = rule._id.toString();

            await assert.doesNotReject(
                workspaceAdminController.LockRule(
                    user, orgTeamUser, ws._id.toString(), ruleId
                )
            );
        });

        it('cannot delete rule', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const rulecol = await getCollection(DB_RULE);
            const rule = await rulecol.findOne({title: "simple rule"});
            const ruleId = rule._id.toString();

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            await assert.rejects(
                rulesController.deleteRule(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString(),
                    ruleId
                ),
                ApplicationError
            );
        });

        it('cannot update rule', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const rulecol = await getCollection(DB_RULE);
            const rule = await rulecol.findOne({title: "simple rule"});
            const ruleId = rule._id.toString();

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});

            await assert.rejects(
                rulesController.updateRule(
                    user, orgTeamUser, ws._id.toString(), chn._id.toString(),
                    ruleId, null, 12, "same rule", ""
                ),
                ApplicationError
            );
        });

        it('should unlock rule', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const rulecol = await getCollection(DB_RULE);
            const rule = await rulecol.findOne({title: "simple rule"});
            const ruleId = rule._id.toString();

            await assert.doesNotReject(
                workspaceAdminController.UnlockRule(
                    user, orgTeamUser, ws._id.toString(), ruleId
                )
            );
        });
    });

    describe('Locking/unlocking function', function(){
        it('should lock function', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcColl = await getCollection(DB_FUNCTIONS);
            const func = await funcColl.findOne({name: 'hellotoo'});
            const func_id = func._id.toString();

            await assert.doesNotReject(
                workspaceAdminController.LockFunction(
                    user, orgTeamUser, ws._id.toString(), func_id
                )
            );
        });

        it('cannot delete function', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcColl = await getCollection(DB_FUNCTIONS);
            const func = await funcColl.findOne({name: 'hellotoo'});
            const func_id = func._id.toString();

            await assert.rejects(
                functionsController.deleteFunction(
                    user, orgTeamUser, 'hellotoo', ws._id.toString()
                ),
                ApplicationError
            );
        });

        it('cannot update function', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcColl = await getCollection(DB_FUNCTIONS);
            const func = await funcColl.findOne({name: 'hellotoo'});
            const func_id = func._id.toString();

            const funcString = `
                function hellomee(){
                    return "hello you";
                }
            `;

            await assert.rejects(
                functionsController.updateFunction(
                    user, orgTeamUser, func_id, funcString, "desc", ws._id.toString()
                ),
                ApplicationError
            );
        });

        it('should unlock function', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcColl = await getCollection(DB_FUNCTIONS);
            const func = await funcColl.findOne({name: 'hellotoo'});
            const func_id = func._id.toString();

            await assert.doesNotReject(
                workspaceAdminController.UnlockFunction(
                    user, orgTeamUser, ws._id.toString(), func_id
                )
            );
        });
    });

    describe('Locking/unlocking variable', function(){
        it('should lock variable', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const varColl = await getCollection(DB_VARIABLES);
            const varOne = await varColl.findOne({name: "MAX_USERS"});

            await assert.doesNotReject(
                workspaceAdminController.LockVariable(
                    user, orgTeamUser, ws._id.toString(), "MAX_USERS"
                )
            );
        });

        it('cannot delete variable', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const varColl = await getCollection(DB_VARIABLES);
            const varOne = await varColl.findOne({name: "MAX_USERS"});

            await assert.rejects(
                variablesController.deleteVariable(
                    user, orgTeamUser, "MAX_USERS", ws._id.toString()
                ),
                ApplicationError
            );
        });

        it('cannot update variable', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const varColl = await getCollection(DB_VARIABLES);
            const varOne = await varColl.findOne({name: "MAX_USERS"});

            await assert.rejects(
                variablesController.updateVariableValue(
                    user, orgTeamUser, "MAX_USERS", 400, "desc", ws._id.toString()
                ),
                ApplicationError
            );
        });

        it('should unlock variable', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const varColl = await getCollection(DB_VARIABLES);
            const varOne = await varColl.findOne({name: "MAX_USERS"});

            await assert.doesNotReject(
                workspaceAdminController.UnlockVariable(
                    user, orgTeamUser, ws._id.toString(), "MAX_USERS"
                )
            );
        });
    });

    describe('Locking/unlocking polling job', function(){
        it('should lock polling job', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const pollColl = await getCollection(DB_POLLING_JOB);
            const pollJob = await pollColl.findOne({name: "poll2"});
            const pollid = pollJob._id.toString();

            await assert.doesNotReject(
                workspaceAdminController.LockPollingJob(
                    user, orgTeamUser, ws._id.toString(), pollid
                )
            );
        });

        it('cannot delete polling job', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const pollColl = await getCollection(DB_POLLING_JOB);
            const pollJob = await pollColl.findOne({name: "poll2"});
            const pollid = pollJob._id.toString();

            await assert.rejects(
                pollingjobController.deletePollingJob(
                    user, orgTeamUser, ws._id.toString(), pollid
                ),
                ApplicationError
            );
        });

        it('cannot update polling job', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const pollColl = await getCollection(DB_POLLING_JOB);
            const pollJob = await pollColl.findOne({name: "poll2"});
            const pollid = pollJob._id.toString();

            await assert.rejects(
                pollingjobController.updatePollingJob(
                    user, orgTeamUser, ws._id.toString(), pollid,
                    "pollme", "desc", null, null, "secret"
                ),
                ApplicationError
            );
        });

        it('should unlock polling job', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const pollColl = await getCollection(DB_POLLING_JOB);
            const pollJob = await pollColl.findOne({name: "poll2"});
            const pollid = pollJob._id.toString();

            await assert.doesNotReject(
                workspaceAdminController.UnlockPollingJob(
                    user, orgTeamUser, ws._id.toString(), pollid
                )
            );
        });
    });
});