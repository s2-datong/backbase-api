const accountController = require('../../app/controllers/Account');
const variablesController = require('../../app/controllers/Variables');
const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_WORKSPACE, DB_VARIABLES} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');
const { ObjectID } = require('mongodb');

const session = {token: ""};

describe('Variables', function(done){
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

    describe('CRUD variables', function(){
        it('should list 0 variables', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const vars = await variablesController.listVariables(
                user, orgTeamUser, ws._id.toString()
            );

            if(!Array.isArray(vars.variables)) assert.fail("Expected variables array");
            assert.deepStrictEqual(vars.variables.length, 0, "Expected 0 variables");
        });

        it('should create 2 variables', async function(){
            this.timeout(10000);
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.doesNotReject(
                variablesController.createVariable(
                    user, orgTeamUser, "MAX_USERS", "5", "variable description", ws._id.toString()
                )
            );

            await assert.rejects(
                variablesController.createVariable(
                    user, orgTeamUser, "MAX_USERS", "5", "variable description", ws._id.toString()
                ),
                ApplicationError
            );

            await assert.doesNotReject(
                variablesController.createVariable(
                    user, orgTeamUser, "COMMISSION", 100, "variable 2 description", ws._id.toString()
                )
            );
        });

        it('should delete 2nd variable', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            await assert.doesNotReject(
                variablesController.deleteVariable(user, orgTeamUser, "COMMISSION", ws._id.toString())
            );
        });

        it('should update 1st variable', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const varColl = await getCollection(DB_VARIABLES);
            const varOne = await varColl.findOne({name: "MAX_USERS"});
            assert.deepStrictEqual(varOne.value, "5", "Expected a value of 5");

            await assert.doesNotReject(
                variablesController.updateVariableValue(user, orgTeamUser, "MAX_USERS", 200, "new description", ws._id.toString())
            );

            const updatedVar = await varColl.findOne({_id: varOne._id});
            assert.deepStrictEqual(updatedVar.value, 200, "Expected a value of 200");
        });

        it('should list 1 variable', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);

            const wsColl = await getCollection(DB_WORKSPACE);
            const ws = await wsColl.findOne({name: 'Workspace 1'});

            const vars = await variablesController.listVariables(
                user, orgTeamUser, ws._id.toString()
            );

            if(!Array.isArray(vars.variables)) assert.fail("Expected variables array");
            assert.deepStrictEqual(vars.variables.length, 1, "Expected 1 variable");
        });
    });
});