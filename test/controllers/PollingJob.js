const accountController = require('../../app/controllers/Account');
const pollingJobsController = require('../../app/controllers/PollingJob');
const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_WORKSPACE, DB_POLLING_JOB, DB_CHANNEL} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');
const { ObjectID } = require('mongodb');

const session = {token: ""};

describe('Polling Jobs', function(done){
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

    describe('CRUD polling jobs', function(){
        it('should list 0 polling jobs', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const polljobs = await pollingJobsController.listPollingJobs(
                user, orgTeamUser, ws._id.toString()
            );

            if(!Array.isArray(polljobs.polling_services)) assert.fail("Expected polling jobs array");
            assert.deepStrictEqual(polljobs.polling_services.length, 0, "Expected 0 polling jobs");
        });

        it('should create 2 polling jobs', async function(){
            this.timeout(12000);
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});
            const channel_id = chn._id.toString();

            await assert.doesNotReject(
                pollingJobsController.createPollingJob(
                    user, orgTeamUser, ws._id.toString(),
                    "poll1", "poll description", "http://localhost:2000", "http://localhost:4000",
                    "secrethash", channel_id, "every minute", "simple"
                )
            );

            await assert.rejects(
                pollingJobsController.createPollingJob(
                    user, orgTeamUser, ws._id.toString(),
                    "poll1", "poll description", "http://localhost:2000", "http://localhost:4000",
                    "secrethash", channel_id, "every minute", "simple"
                ),
                ApplicationError
            );

            await assert.rejects(
                pollingJobsController.createPollingJob(
                    user, orgTeamUser, ws._id.toString(),
                    "poll2", "poll description", "http://localhost:2000", "http://localhost:4000",
                    "secrethash", new ObjectID().toString(), "every 10 minutes", "simple"
                ),
                new ApplicationError("Invalid channel selected")
            );

            await assert.doesNotReject(
                pollingJobsController.createPollingJob(
                    user, orgTeamUser, ws._id.toString(),
                    "poll2", "poll description", "http://localhost:2000", "http://localhost:4000",
                    "secrethash", channel_id, "every 10 minutes", "simple"
                )
            );

            await assert.rejects(
                pollingJobsController.createPollingJob(
                    user, orgTeamUser, ws._id.toString(),
                    "poll3", "poll description", "http://localhost:2000", "http://localhost:4000",
                    "secrethash", channel_id, "every", "stream"
                ),
                new ApplicationError("The interval specified is invalid. Expected (every hour / every 6 minutes etc)")
            );

            await assert.rejects(
                pollingJobsController.createPollingJob(
                    user, orgTeamUser, ws._id.toString(),
                    "poll4", "poll description", "http://localhost:2000", "http://localhost:4000",
                    "secrethash", channel_id, "every hour", "blahhh"
                ),
                new ApplicationError("An invalid queue specified. Expected 'simple' or 'stream'")
            );
        });

        it('should delete 2nd polling job', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const pollColl = await getCollection(DB_POLLING_JOB);
            const pollJob = await pollColl.findOne({name: "poll2"});
            const pollid = pollJob._id.toString();

            await assert.doesNotReject(
                pollingJobsController.deletePollingJob(
                    user, orgTeamUser, ws._id.toString(), pollid
                )
            );
        });

        it('should update 1st polling job', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const pollColl = await getCollection(DB_POLLING_JOB);
            const pollJob = await pollColl.findOne({name: "poll1"});
            const pollid = pollJob._id.toString();

            const chcoll = await getCollection(DB_CHANNEL);
            const chn = await chcoll.findOne({name: "Channel new"});
            const channel_id = chn._id.toString();

            await assert.doesNotReject(
                pollingJobsController.updatePollingJob(
                    user, orgTeamUser, ws._id.toString(), pollid,
                    "poll2", "new description", null, null, "newsecret",
                    channel_id, "every 5 minutes", "simple"
                )
            );
        });

        it('should list 1 polling job', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const polljobs = await pollingJobsController.listPollingJobs(
                user, orgTeamUser, ws._id.toString()
            );

            if(!Array.isArray(polljobs.polling_services)) assert.fail("Expected polling jobs array");
            assert.deepStrictEqual(polljobs.polling_services.length, 1, "Expected 1 polling job");
        });
    });
});