const {getCollection} = require('../db');
const {AccountExistsException, InvalidLoginException, UserNotFoundException, ApplicationError} = require('../exceptions');
const crypto = require('crypto');
const config = require('../../config');
const ObjectID = require('mongodb').ObjectID;
const {v4} = require('uuid');
const jsonwebtoken = require('jsonwebtoken');
const {EmailService, RedisService, StripeService, UserBillingService} = require('../services');
const { DB_USER, DB_ORG, DB_EMAIL_VERIFY, DB_FORGOT_PASSWORD, DB_INVITATION, DB_TEAM } = require('../Constants');
const SubscribeOrganizationToFreePlan = require('./Subscription').subscribeOrgToFreePlan;

class Account{
    static async register(firstname, lastname, email, password){
        const coll = await getCollection(DB_USER);
        let user = await coll.findOne({email: email.toLowerCase()});
        if(user) throw new AccountExistsException();
        const hash = crypto.createHash('SHA256');
        hash.update(password);

        user = {
            _id: new ObjectID(),
            firstname, 
            lastname, 
            email: email.toLowerCase(), 
            password: hash.digest('hex'),
            email_verified: false,
            photo: {
                url: config.app.default_user_photo,
                id: 'none'
            },
            dateCreated: new Date(),
            dateUpdated: new Date()
        }

        const orgColl = await getCollection(DB_ORG);
        const org = {
            _id: new ObjectID(),
            name: 'Default Organization',
            createdBy: user._id,
            api_key: {
                public: `pk-${v4()}`,
                secret: `sk-${v4()}`
            },
            logo: {
                url: config.app.default_org_logo,
                id: 'none'
            },
            workspace_count: 0,
            user_count: 1,
            dateCreated: new Date(),
            dateUpdated: new Date()
        }

        user.default_organization = org._id;

        const teamColl = await getCollection(DB_TEAM);
        const team = {
            user: user._id,
            organization: org._id,
            joined: new Date(),
            status: 'active',
            org_owner: true,
            admin: true
        };
        

        await coll.insertOne(user);
        try{
            await orgColl.insertOne(org);
        }
        catch(e){ await coll.deleteOne({_id: user._id}); }
        await teamColl.insertOne(team);

        // email verification
        const emailToken = v4();
        const email_verifColl = await getCollection(DB_EMAIL_VERIFY);
        const emDate = new Date();
        emDate.setDate(emDate.getDate() + config.app.email.days_token_valid)
        const email_verify = {
            user: user._id,
            email: user.email,
            token: emailToken,
            expires: emDate,
            max_attempt: 3
        };

        await email_verifColl.insertOne(email_verify);
        await EmailService.SendVerificationEmail(email.toLowerCase(), emailToken);
        await RedisService.saveOrgAPIKey(org._id.toString(), org.api_key.public, false);
        await RedisService.saveNewOrganization(org._id.toString());

        const stripeCustomer = await StripeService.createCustomer(user.email, "Default Organization");
        await orgColl.updateOne({_id: org._id}, {$set: {stripe_customer: stripeCustomer.id}});

        await SubscribeOrganizationToFreePlan(org._id);

        return {
            message: 'Account created successfully. Please check your email for a verification link'
        }
    }

    static async login(email, password){
        const coll = await getCollection(DB_USER);
        const hash = crypto.createHash('SHA256');
        hash.update(password);

        const user = await coll.findOne({email: email.toLowerCase(), password: hash.digest('hex')});
        if(!user){
            throw new InvalidLoginException();
        }

        const orgColl = await getCollection(DB_ORG);
        const org = await orgColl.findOne({_id: user.default_organization});

        const tokenId = Math.random().toString(16).substring(2, 16);

        const usDetail = {
            id: user._id.toString(),
            first_name: user.firstname,
            last_name: user.lastname,
            email: user.email,
            verified: user.email_verified,
            photo: user.photo.url,
            organization: {
                id: user.default_organization.toString(),
                name: org.name
            }
        };

        const teamColl = await getCollection(DB_TEAM);
        const teamuser = await teamColl.findOne({user: user._id, organization: user.default_organization});

        const jwtUser = {...usDetail};
        delete jwtUser.photo;
        
        jwtUser.team_user = {
            id: teamuser._id.toString(),
            status: teamuser.status,
            org_owner: teamuser.org_owner,
            admin: teamuser.admin
        };
        jwtUser.token_id = tokenId;
        if(org.system && org.system === true){
            jwtUser.system = true;
        }
        await RedisService.saveSessionToken(usDetail.id, tokenId);

        const token = jsonwebtoken.sign(jwtUser, config.app.jwt.secret, {expiresIn: config.app.jwt.expires});

        return {
            user: usDetail,
            token: token
        };
    }

    static async verifyEmail(email, token){
        const coll = await getCollection(DB_USER);
        const emCol = await getCollection(DB_EMAIL_VERIFY);

        let user = await coll.findOne({email: email.toLowerCase()});

        if(!user) throw new UserNotFoundException();
        if(user.email_verified === true) return {message: 'Email successfully verified'};

        const emv = await emCol.findOne({email: email.toLowerCase(), token});
        if(!emv) throw new ApplicationError("Invalid email verification token");

        const now = new Date();
        const exp = emv.expires;

        if(exp < now ){
            await emCol.deleteOne({_id: emv._id});
            throw new ApplicationError('Email verification token has expired');
        }

        await coll.updateOne({_id: user._id}, {$set: {email_verified: true}});
        await emCol.deleteOne({_id: emv._id});

        await EmailService.SendWelcomeEmail(user.email, user.firstname);

        return {message: 'Email successfully verified'};
    }

    static async resendVerifyEmailLink(email){
        const coll = await getCollection(DB_USER);
        const emCol = await getCollection(DB_EMAIL_VERIFY);

        let user = await coll.findOne({email: email.toLowerCase()});

        if(!user) throw new UserNotFoundException();
        if(user.email_verified === true) throw new ApplicationError('Email already verified');

        const emv = await emCol.findOne({email: email.toLowerCase()});
        const token = emv.token;

        const datenow = new Date();
        datenow.setDate(datenow.getDate() + 2);

        await emCol.updateOne({_id: emv._id}, {$set: {expires: datenow}});

        await EmailService.SendVerificationEmail(email, token);
        return {message: 'Email verification link has been sent to your email address'}

    }

    static async forgotPassword(email){
        const coll = await getCollection(DB_USER);
        const fpcol = await getCollection(DB_FORGOT_PASSWORD);

        const user = await coll.findOne({email: email.toLowerCase()});
        if(!user) throw new UserNotFoundException();

        const token = v4();
        const datenow = new Date();
        datenow.setDate(datenow.getDate() + 2);

        const hasfp = await fpcol.findOne({user: user._id});
        if(hasfp){
            await fpcol.updateOne({_id: hasfp._id}, {$set: {
                token,
                expires: datenow
            }})
        }else{

            const fp = {
                user: user._id,
                token,
                expires: datenow,
                timestamp: new Date()
            };

            await fpcol.insertOne(fp);
        }

        await EmailService.SendPasswordResetEmail(user.firstname, user.email, token);
        return {message: 'An email has been sent for you to reset your password'};
    }

    static async resetPassword(email, passwordResetToken, newpassword){
        const coll = await getCollection(DB_USER);
        const fpcol = await getCollection(DB_FORGOT_PASSWORD);

        const user = await coll.findOne({email: email.toLowerCase()});
        if(!user) throw new UserNotFoundException();

        const hasfp = await fpcol.findOne({user: user._id, token: passwordResetToken});
        if(!hasfp) throw new ApplicationError("Invalid Password Reset Token");

        const now = new Date();
        const exp = hasfp.expires;

        if(exp < now ){
            await fpcol.deleteOne({_id: hasfp._id});
            throw new ApplicationError('Error. Password Reset token has expired');
        }

        const hash = crypto.createHash('SHA256');
        hash.update(newpassword);

        await coll.updateOne({_id: user._id}, {$set: {
            password: hash.digest('hex')
        }});

        await EmailService.SendPasswordUpdatedEmail(user.firstname, user.email);

        return {message: 'Password has been successfully reset'}
    }

    static async createAccountFromInvitation(invitationToken, firstname, lastname, password, retypePassword){
        const usCol = await getCollection(DB_USER);
        const invCol = await getCollection(DB_INVITATION);

        const inv = await invCol.findOne({token: invitationToken});
        if(!inv) throw new ApplicationError("Invitation details not found");

        const email = inv.email;
        const org_id = inv.organization;

        const hash = crypto.createHash('SHA256');
        hash.update(password);

        let user;

        if(inv.userExists === true){
            user = await usCol.findOne({_id: inv.user, password: hash.digest('hex')});
            if(!user) throw new ApplicationError("Please use your existing password to join this organization")
        }else{
            user = {
                _id: new ObjectID(),
                firstname, 
                lastname, 
                email: email,
                password: hash.digest('hex'),
                email_verified: true,
                photo: {
                    url: config.app.default_user_photo,
                    id: 'none'
                },
                dateCreated: new Date(),
                dateUpdated: new Date(),
                default_organization: org_id
            };
            await usCol.insertOne(user);
        }

        const teamColl = await getCollection(DB_TEAM);
        const team = {
            user: user._id,
            organization: org_id,
            joined: new Date(),
            status: 'active',
            org_owner: false,
            admin: false
        };
        await teamColl.insertOne(team);

        
        await invCol.deleteOne({_id: inv._id});
        await EmailService.SendWelcomeEmail(email, firstname);

        const orgColl = await getCollection(DB_ORG);
        await orgColl.updateOne({_id: org_id}, {$inc: {user_count: 1}});

        await RedisService.incrementUsage(org_id.toString(), 'user_count');
        await UserBillingService.TotalOrgUsersChanged(org_id);

        return {message: 'Your account has been successfully created'};
    }

    static async verifyInvitationToken(invitationToken){
        const userCol = await getCollection(DB_USER);
        const invCol = await getCollection(DB_INVITATION);
        const orgCol = await getCollection(DB_ORG);

        const inv = await invCol.findOne({token: invitationToken});
        if(!inv) throw new ApplicationError("Invitation details not found");

        const org = orgCol.findOne({_id: inv.organization});

        const invitedBy = await userCol.findOne({_id: inv.invitedBy});
        const resp = {
            organization: org.name,
            invitedOn: inv.timestamp,
            email: inv.email,
            firstname: "",
            lastname: "",
            invitedBy: `${invitedBy.firstname} ${invitedBy.lastname}`,
            hasAccount: false
        };

        if(inv.userExists === true){
            user = await userCol.findOne({_id: inv.user});
            resp.first_name = user.firstname;
            resp.last_name = user.lastname;
            resp.hasAccount = true;
        }

        return {invitation: resp};
    }
}

module.exports = Account;