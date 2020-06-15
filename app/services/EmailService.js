const axios = require('axios');
const config = require('../../config');

async function PostAxios(url, data){
    try{
        await axios.post(url, data, {
            headers: {
                'Content-type': 'application/json'
            }
        });
    }
    catch(e){
        // log to Sentry
    }
}

exports.EmailService = class EmailService{
    static async SendWelcomeEmail(email, first_name){
        const data = {
            email, firstname: first_name
        };
        const url = `${config.service.email.url}/v1/backbase/welcome`;
        await PostAxios(url, data);
    }

    static async SendVerificationEmail(email, token){
        const data = {
            email, token
        };
        const url = `${config.service.email.url}/v1/backbase/verify`;
        await PostAxios(url, data);
    }

    static async SendPasswordResetEmail(name, email, token){
        const data = {
            email, token, name
        };
        const url = `${config.service.email.url}/v1/backbase/password/reset`;
        await PostAxios(url, data);
    }

    static async SendPasswordUpdatedEmail(name, email){
        const data = {
            email, name
        };
        const url = `${config.service.email.url}/v1/backbase/password/updated`;
        await PostAxios(url, data);
    }

    static async SendNewLoginEmail(name, email){
        const data = {
            email, name
        };
        const url = `${config.service.email.url}/v1/backbase/new/signin`;
        await PostAxios(url, data);
    }

    static async SendInvitationEmail(name, email, nameOfInviter, orgName, Invtoken){
        const data = {
            token: Invtoken,
            org_name: orgName,
            invitee_email: email,
            invitee_name: name,
            inviter_name: nameOfInviter
        };
        const url = `${config.service.email.url}/v1/backbase/new/invitation`;
        await PostAxios(url, data);
    }

    static async AddedToWorkspaceEmail(name, email, userWhoAdded, workspace){
        const data = {
            name, email, userWhoAdded, workspace
        };
        const url = `${config.service.email.url}/v1/backbase/workspace/you-were-added`;
        await PostAxios(url, data);
    }

    static async RemovedFromWorkspaceEmail(name, email, userWhoRemoved, workspace){
        const data = {
            name, email, userWhoRemoved, workspace
        };
        const url = `${config.service.email.url}/v1/backbase/workspace/you-were-removed`;
        await PostAxios(url, data);
    }

    static async SubscriptionSuccessful(email, name){
        const data = {
            name, email
        };
        const url = `${config.service.email.url}/v1/backbase/subscription/successful`;
        await PostAxios(url, data);
    }

    static async SubscriptionCancelled(email){
        const data = {
            email
        };
        const url = `${config.service.email.url}/v1/backbase/subscription/cancelled`;
        await PostAxios(url, data);
    }

    static async SubscriptionUpdated(email, name, old_plan, new_plan){
        const data = {
            name,
            email,
            old_plan,
            new_plan
        };
        const url = `${config.service.email.url}/v1/backbase/subscription/updated`;
        await PostAxios(url, data);
    }

    static async WorkspaceDeleted(usersInWorkspace, workspace_name, deleted_by){
    
        setImmediate(async () => {
            const users = usersInWorkspace;
            const workspaceName = workspace_name;
            const deletedBy = deleted_by;

            if(Array.isArray(users)){
                const url = `${config.service.email.url}/v1/backbase/workspace/deleted`;
                for(let i = 0; i < users.length; i++){
                    const user = users[i];
                    const data = {
                        email: user.email, 
                        name: user.firstname, 
                        workspace_name: workspaceName,
                        deleted_by: deletedBy
                    };
                    await PostAxios(url, data);
                }
            }
        });
    }

    static async OrganizationCreated(email, name, organization_name){
        const data = {
            email, 
            name, 
            organization_name
        };
        const url = `${config.service.email.url}/v1/backbase/organization/created`;
        await PostAxios(url, data);
    }

    static async YouWereRemovedFromOrganization(email, name, organization_name, remover_name){
        const data = {
            name,
            email,
            organization_name,
            remover_name
        };
        const url = `${config.service.email.url}/v1/backbase/organization/you-were-removed`;
        await PostAxios(url, data);
    }

    static async YouLeftOrganization(email, name, organization_name){
        const data = {
            name,
            email,
            organization_name
        };
        const url = `${config.service.email.url}/v1/backbase/organization/you-left`;
        await PostAxios(url, data);
    }

    static async YouHaveTransferedOrgToTeamMember(email, name, organization_name, name_new_user){
        const data = {
            email, name, organization_name, name_new_user
        };
        const url = `${config.service.email.url}/v1/backbase/organization/you-transfered-to-user`;
        await PostAxios(url, data);
    }

    static async OrghasBeenTransferedToYou(email, name, organization_name, transferrer_name){
        const data = {
            email, name, organization_name, transferrer_name
        };
        const url = `${config.service.email.url}/v1/backbase/organization/transfered-to-you`;
        await PostAxios(url, data);
    }
}