const accountController = require('../../app/controllers/Account');
const functionsController = require('../../app/controllers/Functions');
const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_WORKSPACE, DB_FUNCTIONS} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');
const { ObjectID } = require('mongodb');

const session = {token: ""};

describe('Functions', function(done){
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

    describe('CRUD functions', function(){
        it('should list 0 functions', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcs = await functionsController.listFunctions(
                user, orgTeamUser, ws._id.toString()
            );

            if(!Array.isArray(funcs.functions)) assert.fail("Expected functions array");
            assert.deepStrictEqual(funcs.functions.length, 0, "Expected 0 functions");
        });

        it('should create 2 functions', async function(){
            this.timeout(10000);
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcString = `
            function helloYou(){
                    console.log("hello");
                    return "world";
                }
            `;

            const funcString2 = `
            function hellotoo(){
                    return "hello you";
                }
            `;

            await assert.doesNotReject(
                functionsController.createFunction(
                    user, orgTeamUser, funcString, "function description", ws._id.toString()
                )
            );

            await assert.rejects(
                functionsController.createFunction(
                    user, orgTeamUser, funcString, "function description", ws._id.toString()
                ),
                new ApplicationError("A Function with that name already exists")
            );

            await assert.doesNotReject(
                functionsController.createFunction(
                    user, orgTeamUser, funcString2, "function description", ws._id.toString()
                )
            );
        });

        it('should delete 2nd function', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.doesNotReject(
                functionsController.deleteFunction(
                    user, orgTeamUser, "hellotoo", ws._id.toString()
                )
            );
        });

        it('should update 1st function', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcColl = await getCollection(DB_FUNCTIONS);
            const func = await funcColl.findOne({name: 'helloYou'});
            const func_id = func._id.toString();

            const funcString2 = `
                function hellotoo(){
                    return "hello you";
                }
            `;

            await assert.doesNotReject(
                functionsController.updateFunction(
                    user, orgTeamUser, func_id, funcString2, "updated function", ws._id.toString()
                )
            );

            const func2 = await funcColl.findOne({_id: func._id});
            assert.deepStrictEqual(func2.name, "hellotoo");
        });

        it('should list 1 function', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const funcs = await functionsController.listFunctions(
                user, orgTeamUser, ws._id.toString()
            );

            if(!Array.isArray(funcs.functions)) assert.fail("Expected functions array");
            assert.deepStrictEqual(funcs.functions.length, 1, "Expected 1 function");
        });
    });
});