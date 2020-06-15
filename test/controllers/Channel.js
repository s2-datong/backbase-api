const accountController = require('../../app/controllers/Account');
const channelController = require('../../app/controllers/Channel');
const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_CHANNEL, DB_WORKSPACE, DB_USER, DB_TEAM} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');

const session = {token: ""};

describe('Channels', function(done){
    this.timeout(6000);
    // expected to run after workspace.js, use user4 as user1 no longer has any workspace
    before( function(done){
        accountController.login(
            "bbase_user4_test@mailinator.com",
            "new_password"
        ).then(login => {
            session.token = login.token;
            done();
        });
    });

    describe('Channel actions', function(){

        // ws2 has been deleted
        /*it('workspace non-admin non-member cannot create channel in workspace', async function(){
            this.timeout(10000);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws2 = await wsColl.findOne({name: "Workspace 2"});

            const user5 = await accountController.login("bbase_user5_test@mailinator.com", "new_password");
            const userfive = await ParseJWT(user5.token);

            await assert.rejects(
                channelController.createChannel(userfive.user, userfive.orgTeamUser, ws2._id.toString(), "New Channel", "channel description"),
                ApplicationError
            );
        });*/

        it('should create 2 channels', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.doesNotReject(
                channelController.createChannel(user, orgTeamUser, ws._id.toString(), "Channel 1", "channel description")
            );
            await assert.doesNotReject(
                channelController.createChannel(user, orgTeamUser, ws._id.toString(), "Channel 2", "channel description")
            );
        });

        it('cannot create same channel twice', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.rejects(
                channelController.createChannel(user, orgTeamUser, ws._id.toString(), "Channel 1", "channel description"),
                ApplicationError
            );
        });

        it('should list 2 channels', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});
            const channels = await channelController.listChannels(user, orgTeamUser, ws._id.toString());

            if(!Array.isArray(channels.channels)) assert.fail("Expected channels array");
            assert.strictEqual(channels.channels.length, 2, "Expected 2 channels");
        });

        it('should update 1st channel', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel 1"});
            await assert.doesNotReject(
                channelController.updateChannel(user, orgTeamUser, ws._id.toString(), chn._id.toString(), "Channel new", "new description")
            );
        });

        it('should delete second channel', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel 2"});

            await assert.doesNotReject(
                channelController.deleteChannel(user, orgTeamUser, ws._id.toString(), chn._id.toString())
            );
        });

        it('should list 1 channel', async function(){
            const {user, orgTeamUser} = await ParseJWT(session.token);
            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});
            const channels = await channelController.listChannels(user, orgTeamUser, ws._id.toString());

            if(!Array.isArray(channels.channels)) assert.fail("Expected channels array");
            assert.strictEqual(channels.channels.length, 1, "Expected 1 channel");
        });
    });
});