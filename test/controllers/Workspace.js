const accountController = require('../../app/controllers/Account');
const workspaceController = require('../../app/controllers/Workspace');
const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_WORKSPACE, DB_USER, DB_TEAM} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');
const { ObjectID } = require('mongodb');

const session = {token: ""};

describe('Workspace', function(done){
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

    describe('Workspace actions', function(){
        it('should create 2 workspaces', async function(){
            this.timeout(8000);
            const {user, orgTeamUser} = await ParseJWT(session.token);
            
            await assert.doesNotReject(
                workspaceController.createWorkspace(
                    user, orgTeamUser, "Workspace 1", "test workspace 1"
                )
            );

            await assert.doesNotReject(
                workspaceController.createWorkspace(
                    user, orgTeamUser, "Workspace 2", "test workspace 2"
                )
            );
        });

        it('should list 2 workspaces', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wss = await workspaceController.listWorkspaces(user, orgTeamUser);
            if(!Array.isArray(wss.workspaces)) assert.fail("Expected workspaces array");
            assert.strictEqual(wss.workspaces.length, 2, "Expected 2 workspaces");
        });

        it('should return membership data of 1st workspace', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.doesNotReject(
                workspaceController.getUsersWorkspaceMembership(user, orgTeamUser, ws._id.toString())
            );

            const membership = await workspaceController.getUsersWorkspaceMembership(user, orgTeamUser, ws._id.toString());
            assert.strictEqual(membership.membership.workspace_name, "Workspace 1");
            assert.strictEqual(membership.membership.workspace_admin, true);
            assert.strictEqual(membership.membership.workspace_owner, true);
        });

        it('cannot make user not member of workspace to be workspace owner', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const memail = "bbase_user4_test@mailinator.com";

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const userColl = await getCollection(DB_USER);
            const teamColl = await getCollection(DB_TEAM);

            const _user = await userColl.findOne({email: memail});
            const member = await teamColl.findOne({ user: _user._id, organization: user.organization });
            const member_id = member._id.toString();

            await assert.rejects(
                workspaceController.changeWorkspaceOwner(user, orgTeamUser, ws._id.toString(), member_id),
                new ApplicationError("Only a member of this workspace can be upgraded to own the workspace")
            );
        });

        it('should add member to workspace', async function(){
            this.timeout(15000);
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const memail = "bbase_user4_test@mailinator.com";
            const memail2 = "bbase_user5_test@mailinator.com";

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});
            const ws2 = await wsColl.findOne({name: "Workspace 2"});

            const userColl = await getCollection(DB_USER);
            const teamColl = await getCollection(DB_TEAM);

            const _user = await userColl.findOne({email: memail});
            const member = await teamColl.findOne({ user: _user._id, organization: user.organization });
            const member_id = member._id.toString();

            const _user2 = await userColl.findOne({email: memail2});
            const member2 = await teamColl.findOne({ user: _user2._id, organization: user.organization });
            const member_id2 = member2._id.toString();

            await assert.doesNotReject(
                workspaceController.addUserToWorkspace(user, orgTeamUser, ws._id.toString(), member_id)
            );
            await assert.doesNotReject(
                workspaceController.addUserToWorkspace(user, orgTeamUser, ws._id.toString(), member_id2)
            );
            await assert.doesNotReject(
                workspaceController.addUserToWorkspace(user, orgTeamUser, ws2._id.toString(), member_id)
            );
        });

        it('cannot add user to non existent workspace', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            await assert.rejects(
                workspaceController.addUserToWorkspace(user, orgTeamUser, new ObjectID().toString(), new ObjectID().toString()),
                new ApplicationError('Workspace id invalid')
            );
        });

        it('should change workspace owner', async function(){
            this.timeout(8000);
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const memail = "bbase_user4_test@mailinator.com";

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const userColl = await getCollection(DB_USER);
            const teamColl = await getCollection(DB_TEAM);

            const _user = await userColl.findOne({email: memail});
            const member = await teamColl.findOne({ user: _user._id, organization: user.organization });
            const member_id = member._id.toString();

            await assert.doesNotReject(
                workspaceController.changeWorkspaceOwner(user, orgTeamUser, ws._id.toString(), member_id)
            );

            const mem = await workspaceController.getUsersWorkspaceMembership(user, orgTeamUser, ws._id.toString());
            assert.strictEqual(mem.membership.workspace_owner, false);

            const user4 = await accountController.login("bbase_user4_test@mailinator.com", "new_password");
            session.token2 = user4.token;
        });

        it('should remove user from workspace', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token2);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const formeradmin = await ParseJWT(session.token);
            await assert.doesNotReject(
                workspaceController.removeUserFromWorkspace(user, orgTeamUser, ws._id.toString(), formeradmin.orgTeamUser._id.toString())
            );
        });

        it('should list 2 users in workspace', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token2);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});
            const wmembers = await workspaceController.listUsersInWorkspace(user, orgTeamUser, ws._id.toString());

            if(!Array.isArray(wmembers.members)) assert.fail("Expected members array");
            assert.strictEqual(wmembers.members.length, 2, "Expected 2 workspace member");
        });

        it('should list 2 workspaces for user 1 who is org admin', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wss = await workspaceController.listWorkspaces(user, orgTeamUser);
            if(!Array.isArray(wss.workspaces)) assert.fail("Expected workspaces array");
            assert.strictEqual(wss.workspaces.length, 2, "Expected 2 workspaces");
        });

        it('should delete workspace', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 2'});

            await assert.doesNotReject(
                workspaceController.deleteWorkspace(user, orgTeamUser, ws._id.toString())
            );
        });

        it('should list 1 workspace for user 1 who is org admin', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wss = await workspaceController.listWorkspaces(user, orgTeamUser);
            if(!Array.isArray(wss.workspaces)) assert.fail("Expected workspaces array");
            assert.strictEqual(wss.workspaces.length, 1, "Expected 1 workspaces");
        });

        it('should list 1 workspace for user 4', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token2);
            const wss = await workspaceController.listWorkspaces(user, orgTeamUser);
            if(!Array.isArray(wss.workspaces)) assert.fail("Expected workspaces array");
            assert.strictEqual(wss.workspaces.length, 1, "Expected 1 workspace");
        });
        
    });
});