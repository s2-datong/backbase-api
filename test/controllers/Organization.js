const accountController = require('../../app/controllers/Account');
const organizationController = require('../../app/controllers/Organization');
const { ApplicationError} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_INVITATION, DB_TEAM, DB_USER, DB_ORG} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');

const session = {};

describe('Organization', function(){
    this.timeout(6000);
    before( function(done){
        accountController.login(
            "bbase_user1_test@mailinator.com",
            "new_password"
        ).then(login => {
            session.token = login.token;
            done();
        });
        //session.jwt = login.token;
    });

    describe('Company Details', function(){
        it('should update organization name and logo', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const files = {
                logo: {
                    truncated: false,
                    tempFilePath: path.resolve(__dirname, './logo.png')
                }
            };
            
            await assert.doesNotReject(
                organizationController.updateCompanyDetails(user, orgTeamUser, "TEST ORG", files)
            );
        });

        
    });

    describe('Team members', function(){
        it('should send invitation to single team member', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.doesNotReject(
                organizationController.inviteTeamMember(user, orgTeamUser, "bbase_user2_test@mailinator.com")
            );
        });

        it('should send invitation to 3 team members', async function(){
            this.timeout(10000);
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.doesNotReject(
                organizationController.inviteTeamMembers(
                    user, 
                    orgTeamUser, 
                    [
                        "bbase_user2_test@mailinator.com",
                        "bbase_user4_test@mailinator.com",
                        "bbase_user5_test@mailinator.com"
                    ]
                )
            );
        });

        it('should reject sending more than 10 invites', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.rejects(
                organizationController.inviteTeamMembers(
                    user, 
                    orgTeamUser, 
                    [
                        "bbase_user6_test@mailinator.com",
                        "bbase_user7_test@mailinator.com",
                        "bbase_user8_test@mailinator.com",
                        "bbase_user9_test@mailinator.com",
                        "bbase_user10_test@mailinator.com",
                        "bbase_user11_test@mailinator.com",
                        "bbase_user12_test@mailinator.com",
                        "bbase_user13_test@mailinator.com",
                        "bbase_user14_test@mailinator.com",
                        "bbase_user15_test@mailinator.com",
                        "bbase_user16_test@mailinator.com",
                        "bbase_user17_test@mailinator.com"
                    ]
                ),
                ApplicationError
            );
        });

        it('should list team members', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.doesNotReject(
                organizationController.listTeamMembers(
                    user, orgTeamUser, 3
                )
            );
        });
    });

    describe('Accepting Invitation', function(){
        it('should verify invitation token of invited user', async function(){
            //const {user, orgTeamUser } = await ParseJWT(session.token);
            const invColl = await getCollection(DB_INVITATION);
            const inv = await invColl.findOne({email: "bbase_user2_test@mailinator.com"});
            const token = inv.token;

            await assert.doesNotReject(
                accountController.verifyInvitationToken(token)
            );
        });

        it('should not create account for invited user with invalid token', async function(){
            //const {user, orgTeamUser } = await ParseJWT(session.token);

            await assert.rejects(
                accountController.createAccountFromInvitation(
                    "dummy_token", "First", "last", "new_password", "new_password"
                ),
                ApplicationError
            );
        });

        it('should create account for invited user with valid token', async function(){
           // const {user, orgTeamUser } = await ParseJWT(session.token);
           this.timeout(10000);
            const invColl = await getCollection(DB_INVITATION);
            const inv = await invColl.findOne({email: "bbase_user2_test@mailinator.com"});
            const token = inv.token;

            await assert.doesNotReject(
                accountController.createAccountFromInvitation(
                    token, "First", "last", "new_password", "new_password"
                )
            );

            const inv2 = await invColl.findOne({email: "bbase_user4_test@mailinator.com"});
            const token2 = inv2.token;

            await assert.doesNotReject(
                accountController.createAccountFromInvitation(
                    token2, "BBase", "Four", "new_password", "new_password"
                )
            );
            
            const inv3 = await invColl.findOne({email: "bbase_user5_test@mailinator.com"});
            const token3 = inv3.token;

            await assert.doesNotReject(
                accountController.createAccountFromInvitation(
                    token3, "BBaseV", "Five", "new_password", "new_password"
                )
            );
        });

        it('listing team members should return 4 members', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const team = await organizationController.listTeamMembers(
                user, orgTeamUser
            );
            if(team.team && Array.isArray(team.team) && team.team.length === 4){
                //
            }else{
                assert.fail('Expected 4 team members');
            }
        });
    });

    describe('Admin Actions', function(){
        it('Should add admin priviledge to teammember', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const userColl = await getCollection(DB_USER);
            const teamColl = await getCollection(DB_TEAM);

            const _user = await userColl.findOne({email: "bbase_user2_test@mailinator.com"});
            const member = await teamColl.findOne({ user: _user._id });
            const member_id = member._id.toString();

            await assert.doesNotReject(
                organizationController.makeTeamMemberAdmin(
                    user, orgTeamUser, member_id
                )
            );
        });

        it('Should remove admin priviledge from team member', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const userColl = await getCollection(DB_USER);
            const teamColl = await getCollection(DB_TEAM);

            const _user = await userColl.findOne({email: "bbase_user2_test@mailinator.com"});
            const member = await teamColl.findOne({ user: _user._id });
            const member_id = member._id.toString();

            await assert.doesNotReject(
                organizationController.removeAdminPriviledgeFromMember(
                    user, orgTeamUser, member_id
                )
            );
        });

        it('Should not remove admin priviledge from self', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const member_id = orgTeamUser._id.toString();

            await assert.rejects(
                organizationController.removeAdminPriviledgeFromMember(
                    user, orgTeamUser, member_id
                ),
                ApplicationError
            );
        });

        it('Only admin can add admin priviledge', async function(){
            const otherUser = await accountController.login(
                "bbase_user2_test@mailinator.com", "new_password"
            );

            const p = await ParseJWT(session.token);

            const _token = otherUser.token;
            const {user, orgTeamUser } = await ParseJWT(_token);

            await assert.rejects(
                organizationController.makeTeamMemberAdmin(
                    user, orgTeamUser, p.orgTeamUser._id
                )
            );
        });

        it('Should delete team member', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const userColl = await getCollection(DB_USER);
            const teamColl = await getCollection(DB_TEAM);

            const _user = await userColl.findOne({email: "bbase_user2_test@mailinator.com"});
            const member = await teamColl.findOne({ user: _user._id });
            const member_id = member._id.toString();

            await assert.doesNotReject(
                organizationController.deleteTeamMember(
                    user, orgTeamUser, member_id
                )
            );
        });

        it('listing team members should return 3 members', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const team = await organizationController.listTeamMembers(
                user, orgTeamUser
            );

            if(team.team && Array.isArray(team.team) && team.team.length === 3){
                //
            }else{
                assert.fail('Expected 3 team members');
            }
        })
    });

    describe('Settings', function(){
        it('should get organization api keys', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.doesNotReject(
                organizationController.getSettings(user)
            );
        });
    });

    describe('Organization Meta', function(){
        it('should create a new organization', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.doesNotReject(
                organizationController.createNewOrganization(
                    user, orgTeamUser
                )
            );
        });

        it('should list 2 organizations I belong to', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            let orgs = await organizationController.ListOrganizations(user, orgTeamUser);
            const orglist = orgs.organizations;

            if(Array.isArray(orglist) && orglist.length === 2){
                //
            }else{
                assert.fail(new Error("Expecting 2 organizations"));
            }
        });

        it('should switch token to new organization', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const orgColl = await getCollection(DB_ORG);
            const otherOrg = await orgColl.findOne({name: "New Organization"});
            const org_id = otherOrg._id.toString();

            const result = await organizationController.switchOrganization(user, orgTeamUser, org_id);
            assert.notStrictEqual(session.token, result.token);

            const parse2 = await ParseJWT(result.token);
            await organizationController.switchOrganization(parse2.user, parse2.orgTeamUser, user.organization.toString());
        });

        it('switch org should throw error when invalid member_id supplied', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.rejects(
                organizationController.TransferOrganization(user, orgTeamUser, "5bcd"),
                Error
            );
        });

        it('should transfer 2nd organization to team member', async function(){
            this.timeout(10000);
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const orgColl = await getCollection(DB_ORG);
            const otherOrg = await orgColl.findOne({name: "New Organization"});
            const org_id = otherOrg._id.toString();
            

            const result = await organizationController.switchOrganization(user, orgTeamUser, org_id);
            const otherToken = result.token;
            const otherParsedJWT = await ParseJWT(otherToken);

            await organizationController.inviteTeamMember(otherParsedJWT.user, otherParsedJWT.orgTeamUser, "bbase_user4_test@mailinator.com");
            const invColl = await getCollection(DB_INVITATION);
            const inv = await invColl.findOne({email: "bbase_user4_test@mailinator.com"});
            const token = inv.token;

            await assert.doesNotReject(
                accountController.createAccountFromInvitation(
                    token, "First", "last", "new_password", "new_password"
                )
            );

            const userColl = await getCollection(DB_USER);
            const teamColl = await getCollection(DB_TEAM);

            const _user = await userColl.findOne({email: "bbase_user4_test@mailinator.com"});
            const member = await teamColl.findOne({ user: _user._id, organization: otherParsedJWT.user.organization });
            const member_id = member._id.toString();
            
            await assert.doesNotReject(
                organizationController.TransferOrganization(otherParsedJWT.user, otherParsedJWT.orgTeamUser, member_id)
            );

            await organizationController.switchOrganization(otherParsedJWT.user, otherParsedJWT.orgTeamUser, user.organization.toString());
        });
    });
});