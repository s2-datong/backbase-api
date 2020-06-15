const accountController = require('../../app/controllers/Account');
const {InvalidLoginException, ApplicationError, AccountExistsException} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_EMAIL_VERIFY, DB_FORGOT_PASSWORD} = require('../../app/Constants');

const session = {};

describe('Account Controller', function(){
    describe('Register', function(){
        it('Should register new account', async function(){
            this.timeout(7000);
            let pr = accountController.register(
                "Test", "User", "bbase_user1_test@mailinator.com",
                "password"
            );
            await assert.doesNotReject(pr);
        });
        it('Should refuse same email', async function(){
            let pr = accountController.register(
                "Test", "User", "bbase_user1_test@mailinator.com",
                "password"
            );
            await assert.rejects(pr, AccountExistsException);
        });
    });

    describe('Login', function(){
        it('should fail with invalid credentials', async function(){
            await assert.rejects(accountController.login('foo', 'bar'), InvalidLoginException);
        });

        it('should return with success message', async function(){
            let result = await accountController.login(
                "bbase_user1_test@mailinator.com",
                "password"
            );
            if(result && result.user && result.token){
                session.token = result.token;
            }else{
                throw new Error("Login failed");
            }
        });
    });

    describe('Verify Email', function(){
        it('should not verify email with invalid token', async function(){
            this.timeout(5000);
            const pr = accountController.verifyEmail("bbase_user1_test@mailinator.com", '12345678');
            await assert.rejects(pr, ApplicationError);

            const pr2 = accountController.verifyEmail("me@email.com", 'token');
            await assert.rejects(pr2, ApplicationError);
        });

        it('should verify email with valid token', async function(){
            this.timeout(5000);
            const emailVerifyColl = await getCollection(DB_EMAIL_VERIFY);
            const verifyEmail = await emailVerifyColl.findOne({email: "bbase_user1_test@mailinator.com"});
            const token = verifyEmail.token;

            const pr = accountController.verifyEmail("bbase_user1_test@mailinator.com", token);
            await assert.doesNotReject(pr);
        });
    });

    describe('forgot password', function(){
        this.timeout(6000);
        it('should send an email to reset your password', async function(){
            await assert.doesNotReject(
                accountController.forgotPassword("bbase_user1_test@mailinator.com")
            );
        });

        it('should not reset password with invalid token', async function(){
            await assert.rejects(
                accountController.resetPassword("bbase_user1_test@mailinator.com", "token", "new_password"),
                ApplicationError
            );
        });

        it('should reset password with valid password reset token', async function(){
            const coll = await getCollection(DB_FORGOT_PASSWORD);
            const date = new Date();
            date.setDate(date.getDate() - 1);
            const expiredDate = new Date(date);
            date.setDate(date.getDate() + 4);
            const notExpiredDate = new Date(date);

            const fp = await coll.findOne({});
            const token = fp.token;

            await coll.updateOne({_id: fp._id}, {$set: {expires: expiredDate}});
            await assert.rejects(
                accountController.resetPassword("bbase_user1_test@mailinator.com", token, "new_password"),
                ApplicationError
            );

            await coll.insertOne(fp);
            await assert.doesNotReject(
                accountController.resetPassword("bbase_user1_test@mailinator.com", token, "new_password")
            );
        });
    });

});