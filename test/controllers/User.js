const accountController = require('../../app/controllers/Account');
const userController = require('../../app/controllers/User');
const {ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_SUBSCRIPTION} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');

const session = {};

describe('User', function(){
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

    describe('user actions', function(){
        it('should return user profile', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.doesNotReject(
                userController.profile(user, orgTeamUser)
            );

            const profile = await userController.profile(user, orgTeamUser);
            assert.strictEqual(profile.profile.email, "bbase_user1_test@mailinator.com");
        });

        it('should update user profile', async function(){
            this.timeout(10000);
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const files = {
                photo: {
                    truncated: false,
                    tempFilePath: path.resolve(__dirname, './logo.png')
                }
            };

            await assert.doesNotReject(
                userController.updateProfile(
                    user, orgTeamUser, "", "", "new_password", "updated_password", files
                )
            );

            await assert.doesNotReject(
                accountController.login(
                    "bbase_user1_test@mailinator.com",
                    "updated_password"
                )
            );

            await userController.updateProfile(
                user, orgTeamUser, "", "", "updated_password", "new_password"
            );
        });

        it('should refresh user token', async function(){
            // refresh token and get profile with new token
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const refreshed = await userController.refreshToken(user, orgTeamUser);
            assert.notDeepStrictEqual(refreshed.token, session.token);
        });
    });
});