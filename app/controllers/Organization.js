const {getCollection} = require('../db');
const {OperationNotAllowedException, UserNotFoundException, ApplicationError} = require('../exceptions');
const config = require('../../config');
const ObjectID = require('mongodb').ObjectID;
const {EmailService, StorageService, StripeService, RedisService, UserBillingService} = require('../services');
const { DB_USER, DB_ORG, DB_WORKSPACE_MEMBERS, DB_INVITATION, DB_TEAM } = require('../Constants');
const {v4} = require('uuid');
const jsonwebtoken = require('jsonwebtoken');
const SubscribeOrganizationToFreePlan = require('./Subscription').subscribeOrgToFreePlan;
const FileArray = require('express-fileupload').FileArray;

class Organization{
    static async updateCompanyDetails(user, orgTeamUser, companyname, files){
        //if(files && !(files instanceof FileArray)) throw new Error("Implementation Error. Expecting file array");
        const orgColl = await getCollection(DB_ORG);
        const org = await orgColl.findOne({_id: user.organization});

        let toupdate = false;
        let sett = {$set: {}};

        if(companyname != null && companyname != ''){
            sett.$set.companyname = companyname;
            toupdate = true;
        }

        if(files && files.logo){
            if(files.logo.truncated === true) throw new ApplicationError('Image too large');
            const resp = await StorageService.Upload(files.logo.tempFilePath);
            sett.$set.logo = {
                url: resp.url,
                id: resp.public_id
            };
            toupdate = true;
            if(org.logo.id !== 'none'){
                // i've uploaded a logo before
                await StorageService.delete(org.logo.id);
            }
        }

        if(toupdate === true){
            await orgColl.updateOne({_id: org._id}, sett);
            if(sett.$set.companyname){
                await StripeService.updateCustomerName(
                    org.stripe_customer, companyname
                );
            }
        }

        return {message: 'Company profile updated'};
    }
    
    static async inviteTeamMember(user, orgTeamUser, email){
        const invColl = await getCollection(DB_INVITATION);
        const userColl = await getCollection(DB_USER);
        const orgColl = await getCollection(DB_ORG);
        const teamColl = await getCollection(DB_TEAM);

        const alreadyInvited = await invColl.findOne({email: email.toLowerCase(), organization: user.organization});
        if(alreadyInvited) throw new ApplicationError("You have already invited this user");

        const emailExists = await userColl.findOne({email: email.toLowerCase()});
        if(emailExists){
            const alreadyTeam = await teamColl.findOne({user: emailExists._id, organization: user.organization});
            if(alreadyTeam) throw new ApplicationError("This user is already in your team");
        }

        const invToken = v4();
        const name = "Dear User";

        const org = await orgColl.findOne({_id: user.organization});

        const inv = {
            email: email.toLowerCase(),
            organization: user.organization,
            name,
            token: invToken,
            invitedBy: user._id,
            timestamp: new Date(),
            userExists: false
        };

        if(emailExists){
            inv.userExists = true;
            inv.user = emailExists._id;
        }

        await invColl.insertOne(inv);
        await EmailService.SendInvitationEmail(name, email.toLowerCase(), user.firstname, org.name, invToken);

        return {message: `Invitation has been sent successfully`};
    }

    static async inviteTeamMembers(user, orgTeamUser, emails){
        if(!Array.isArray(emails)) throw new ApplicationError('Expecting emails to be an array of email addresses');
        if(emails.length > config.app.max_invite_emails) throw new ApplicationError(`You cannot invite more than ${config.app.max_invite_emails} users at once`);

        const invColl = await getCollection(DB_INVITATION);
        const userColl = await getCollection(DB_USER);
        const orgColl = await getCollection(DB_ORG);
        const teamColl = await getCollection(DB_TEAM);

        const _emails = emails.map(e => e.toLowerCase() );

        const alreadyInvited = await invColl.find({email: {$in: [_emails]}, organization: user.organization}).toArray();
        const _emInvited = alreadyInvited.map(e => e.email);

        const usersExists = await userColl.find({email: {$in: [_emails]} }).toArray();
        const _userIds = usersExists.map(u => u._id);

        const alreadyTeamMembers = await teamColl.find({user: {$in: _userIds}, organization: user.organization}).toArray();
        const alreadyTeamUserIds = alreadyTeamMembers.map(al => al.user.toString() );
        const alreadyTeamUsers = usersExists.filter(u => alreadyTeamUserIds.find(u._id.toString() !== undefined) );


        const _emReg = alreadyTeamUsers.map(e => e.email);

        const _all = [..._emInvited, ..._emReg];

        const notInvitedOrReg = _emails.filter(e => _all.find(em => em === e) === undefined);
        const org = await orgColl.findOne({_id: user.organization});

        for(let i = 0; i < notInvitedOrReg.length; i++){
            const toInvite = notInvitedOrReg[i]; // email

            const invToken = v4();
            const name = "Dear User";

            const inv = {
                email: toInvite,
                organization: user.organization,
                name,
                token: invToken,
                invitedBy: user._id,
                timestamp: new Date(),
                userExists: false
            };

            // does this user already exist
            const __user = usersExists.find(us => us.email === toInvite);
            if(__user !== undefined){
                inv.userExists = true;
                inv.user = __user._id;
            }

            await invColl.insertOne(inv);
            await EmailService.SendInvitationEmail(name, toInvite, user.firstname, org.name, invToken);
        }

        let msg = '';
        if(_emInvited.length > 0) msg += `${_emInvited.length} emails have already been invited`;
        if(_emReg.length > 0) msg += ` ${_emReg.length} emails are already part of your organization`;
        if(notInvitedOrReg.length > 0) msg += ` ${notInvitedOrReg.length} users were successfully invited to your organization`;

        return {message: msg};
    }

    static async listTeamMembers(user, orgTeamUser, limit = 100, page = 1){
        const teamColl = await getCollection(DB_TEAM);
        const userColl = await getCollection(DB_USER);
        const skip = (page - 1) * limit;
        const team = await teamColl.find({organization: user.organization/*, user: {$ne: user._id}*/}).skip(skip).limit(limit).sort({_id: 1}).toArray();
        const user_ids = team.map(t => t.user);
        const users = await userColl.find({_id: {$in: user_ids}}).sort({firstname: 1}).toArray();
        
        const members = users.map(u => ({
            id: team.find(t => t.user.toString() === u._id.toString())['_id'].toString(),
            firstname: u.firstname,
            lastname: u.lastname,
            image: u.photo.url
        }));

        return {
            message: 'team members',
            team: members
        };
    }

    static async deleteTeamMember(user, orgTeamUser, member_id){
        // remove from workspace as well,
        // send email that account has been deleted
        const userColl = await getCollection(DB_USER);
        const teamColl = await getCollection(DB_TEAM);
        const orgColl = await getCollection(DB_ORG);

        const member = await teamColl.findOne({_id: new ObjectID(member_id), organization: user.organization});
        if(!member) throw new UserNotFoundException();
        const memberUser = await userColl.findOne({_id: member.user});

        const org = await orgColl.findOne({_id: user.organization});

        // orgOwner cannot be removed, unless they transfer ownership of org to
        // another team member
        if(member.org_owner === true) throw new ApplicationError(
            `"${memberUser.firstname}" cannot be removed from this organization until they transfer ownership of the organization to another Team Member`
        );

        // Also, I can exit an organization
        // email would state that I exited the org rather than I was removed
        let iAmLeavingByMyself = false;
        let s_message = `${memberUser.firstname} is no longer a part of this organization`;
        if(user._id.toString() === memberUser._id.toString()){
            // I am removing myself/leaving org
            iAmLeavingByMyself = true;
            s_message = `You are no longer a part of this organization. You would need to login again`;
        }

        if(iAmLeavingByMyself === false){
            // I am being removed from Org
            // only team member with admin priviledge should be able to remove me
            if(orgTeamUser.admin === false ) throw new OperationNotAllowedException();
        }

        // remove user from any workspaces they are a part of WORKSPACE_MEMBERSHIP_COLL
        const wpMemberColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const wpMemwhere = {
            user: member._id, organization: user.organization
        };
        await wpMemberColl.deleteMany(wpMemwhere);

        // remove user membership data from org, TEAM_COLL
        await teamColl.deleteOne({_id: member._id});
        
        await RedisService.decrementUsage(user.organization.toString(), 'user_count');
        // forces me to login again
        await RedisService.clearAllSessions(memberUser._id.toString());
        await UserBillingService.TotalOrgUsersChanged(user.organization);

        if(iAmLeavingByMyself === true){
            await EmailService.YouLeftOrganization(user.email, user.firstname,  org.name);
        }else{
            await EmailService.YouWereRemovedFromOrganization(memberUser.email, memberUser.firstname, org.name);
        }
        return {
            message: s_message
        };
    }

    static async makeTeamMemberAdmin(user, orgTeamUser, member_id){
        const userColl = await getCollection(DB_USER);
        const teamColl = await getCollection(DB_TEAM);
        if(orgTeamUser.org_owner === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const member = await teamColl.findOne({_id: new ObjectID(member_id), organization: user.organization});
        if(!member) throw new UserNotFoundException();
        const memberUser = await userColl.findOne({_id: member.user});

        if(member_id === orgTeamUser._id.toString()) throw new ApplicationError("You cannot make yourself an admin");

        await teamColl.updateOne({_id: member._id}, {$set: {admin: true}});
        return {message: `${memberUser.firstname} has been made an admin`};
    }

    static async removeAdminPriviledgeFromMember(user, orgTeamUser, member_id){
        const userColl = await getCollection(DB_USER);
        const teamColl = await getCollection(DB_TEAM);
        if(orgTeamUser.org_owner === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const member = await teamColl.findOne({_id: new ObjectID(member_id), organization: user.organization});
        if(!member) throw new UserNotFoundException();
        const memberUser = await userColl.findOne({_id: member.user});

        if(member_id === orgTeamUser._id.toString()) throw new ApplicationError("You cannot remove admin priviledge from yourself");

        await teamColl.updateOne({_id: member._id}, {$set: {admin: false}});
        return {message: `${memberUser.firstname} has been removed as an admin`};
    }

    static async getSettings(user){
        const orgColl = await getCollection(DB_ORG);

        const org = await orgColl.findOne({_id: user.organization});

        const sett = {
            api_key: {
                public: org.api_key.public,
                secret: org.api_key.secret
            }
        };

        return {settings: sett};
    }

    static async updateSettings(user){
        //
    }

    static async createNewOrganization(user, orgTeamUser){
        // creates org
        // adds you as only team member in org
        const orgColl = await getCollection(DB_ORG);
        const teamColl = await getCollection(DB_TEAM);

        const org = {
            _id: new ObjectID(),
            name: "New Organization",
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
            dateUpdated: new Date(),
        };

        const team = {
            user: user._id,
            organization: org._id,
            joined: new Date(),
            status: 'active',
            org_owner: true,
            admin: true
        };

        await orgColl.insertOne(org);
        await teamColl.insertOne(team);

        await RedisService.saveOrgAPIKey(org._id.toString(), org.api_key.public, false);
        await RedisService.saveNewOrganization(org._id.toString());
        

        const stripeCustomer = await StripeService.createCustomer(user.email, org.name);
        await orgColl.updateOne({_id: org._id}, {$set: {stripe_customer: stripeCustomer.id}});

        await SubscribeOrganizationToFreePlan(org._id);

        await EmailService.OrganizationCreated(user.email, user.firstname, org.name);
        
        return {message: `New Organization Created`, id: org._id.toString() }
    }

    static async switchOrganization(user, orgTeamUser, org_id){
        // generates a new JWT
        // that is scoped to the new org you're switching to

        const orgColl = await getCollection(DB_ORG);
        const teamColl = await getCollection(DB_TEAM);
        const userColl = await getCollection(DB_USER);

        const org = await orgColl.findOne({_id: new ObjectID(org_id)});
        if(!org) throw new ApplicationError('Organization not found');

        const teamMemberOfOrg = await teamColl.findOne({
            organization: org._id, user: user._id
        });

        if(!teamMemberOfOrg) throw new ApplicationError('Cannot switch to this organization');
        await userColl.updateOne({_id: user._id}, {$set: {
            default_organization: org._id
        }});

        const _user = await userColl.findOne({_id: user._id});

        const usDetail = {
            id: user._id.toString(),
            first_name: user.firstname,
            last_name: user.lastname,
            email: user.email,
            verified: user.email_verified,
            photo: _user.photo.url,
            organization: {
                id: org_id,
                name: org.name
            }
        };
        const jwtUser = {...usDetail};
        delete jwtUser.photo;
        jwtUser.team_user = {
            id: teamMemberOfOrg._id.toString(),
            status: teamMemberOfOrg.status,
            org_owner: teamMemberOfOrg.org_owner,
            admin: teamMemberOfOrg.admin
        }; 
        jwtUser.token_id = user.token_id;
        if(org.system && org.system === true){
            jwtUser.system = true;
        }

        const token = jsonwebtoken.sign(jwtUser, config.app.jwt.secret, {expiresIn: config.app.jwt.expires});
        return {
            user: usDetail,
            token: token
        };
    }

    static async TransferOrganization(user, orgTeamUser, teamMemberId){

        if(teamMemberId === orgTeamUser._id.toString()) throw new ApplicationError("You cannot transfer organization to yourself");
        if(orgTeamUser.org_owner !== true) throw new OperationNotAllowedException("You are not the owner of this organization and therefore cannot transfer it");

        const userColl = await getCollection(DB_USER);
        const teamColl = await getCollection(DB_TEAM);
        const orgColl = await getCollection(DB_ORG);

        const org = await orgColl.findOne({_id: user.organization});

        const teamMember = await teamColl.findOne({_id: new ObjectID(teamMemberId), organization: user.organization});
        if(!teamMember) throw new ApplicationError("Team member not found");
        const teamMemberUser = await userColl.findOne({_id: teamMember.user});

        await teamColl.updateOne({_id: orgTeamUser._id}, {$set: {
            org_owner: false
        }});
        await teamColl.updateOne({_id: teamMember._id}, {$set: {
            org_owner: true,
            admin: true
        }});

        await EmailService.YouHaveTransferedOrgToTeamMember(user.email, user.firstname, org.name, teamMemberUser.firstname);
        await EmailService.OrghasBeenTransferedToYou(teamMemberUser.email, teamMemberUser.firstname, org.name, user.firstname);

        return {message: `Organization has been transfered to ${teamMemberUser.firstname}`};
    }

    static async ListOrganizations(user, orgTeamUser){
        const orgColl = await getCollection(DB_ORG);
        const teamColl = await getCollection(DB_TEAM);

        const myMemberships = await teamColl.find({user: user._id}).sort({_id: -1}).toArray();
        const orgIds = myMemberships.map(m => m.organization);

        const myOrgs = await orgColl.find({_id: {$in: orgIds}}).toArray();

        const _memberships = myMemberships.map(membership => {
            const org = myOrgs.find(_org => _org._id.toString() === membership.organization.toString());
            const _myorg = {
                id: org._id.toString(),
                name: org.name,
                logo: org.logo.url,
                admin: membership.admin,
                org_owner: membership.org_owner
            };
            return _myorg;
        });

        return {organizations: _memberships};
    }

    static async RefreshAPIKey(user, orgTeamUser){
        if(orgTeamUser.admin !== true) throw new OperationNotAllowedException();
        const api_key = {
            public: `pk-${v4()}`,
            secret: `sk-${v4()}`
        };

        const sett = {
            $set: { api_key }
        };

        const orgColl = await getCollection(DB_ORG);
        const org = await orgColl.findOne({_id: user.organization});
        await orgColl.updateOne({_id: org._id}, sett);

        // REDIS: refresh API Key
        await RedisService.replaceAPIKey(
            org._id.toString(), org.api_key.public, 
            api_key.public, false
        );

        return {message: "API Keys have been refreshed", api_key}
    }
}

module.exports = Organization;