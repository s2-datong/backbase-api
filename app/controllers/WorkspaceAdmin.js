const {getCollection} = require('../db');
const {OperationNotAllowedException, ApplicationError} = require('../exceptions');
const ObjectID = require('mongodb').ObjectID;
const {EmailService} = require('../services');
const { DB_WORKSPACE_MEMBERS, DB_WORKSPACE } = require('../Constants');
const { DB_VARIABLES, DB_POLLING_JOB, DB_FUNCTIONS} = require('../Constants');
const {DB_CHANNEL, DB_RULE} = require('../Constants');

class WorkspaceAdmin{

    static async makeUserWorkspaceAdmin(user, orgTeamUser, workspace_id, team_user_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const otherMember = await memColl.findOne({
            user: new ObjectID(team_user_id),
            organization: user.organization
        });

        if(!otherMember) throw new ApplicationError("User you are trying to make admin is not a member of this workspace");

        await memColl.updateOne({_id: otherMember._id}, {$set: {workspace_admin: true} });
        return {message: 'Workspace member has been granted admin priviledge'};
    }

    static async removeWorkspaceAdminPriviledge(user, orgTeamUser, workspace_id, team_user_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const otherMember = await memColl.findOne({
            user: new ObjectID(team_user_id),
            organization: user.organization
        });

        if(!otherMember) throw new ApplicationError("User you are trying to make not admin is not a member of this workspace");

        await memColl.updateOne({_id: otherMember._id}, {$set: {workspace_admin: false} });
        return {message: 'Admin Priviledge has been removed from Workspace member'};
    }

    static async LockWorkspace(user, orgTeamUser, workspace_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        await wpColl.updateOne({_id: workspace._id}, {$set: {locked: true}});

        return {message: `Worksspace "${workspace.name}" has been locked`};
    }

    static async UnlockWorkspace(user, orgTeamUser, workspace_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        await wpColl.updateOne({_id: workspace._id}, {$unset: {locked: 1}});

        return {message: `Worksspace "${workspace.name}" has been unlocked`};
    }

    static async LockFunction(user, orgTeamUser, workspace_id, function_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const funcColl = await getCollection(DB_FUNCTIONS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const func = await funcColl.findOne({_id: new ObjectID(function_id), workspace: workspace._id});
        if(!func) throw new ApplicationError("Function not found");

        await funcColl.updateOne({_id: func._id}, {$set: {locked: true}});
        return {message: `Function "${func.name}" has been locked`};
    }

    static async UnlockFunction(user, orgTeamUser, workspace_id, function_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const funcColl = await getCollection(DB_FUNCTIONS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const func = await funcColl.findOne({_id: new ObjectID(function_id), workspace: workspace._id});
        if(!func) throw new ApplicationError("Function not found");

        await funcColl.updateOne({_id: func._id}, {$unset: {locked: 1}});
        return {message: `Function "${func.name}" has been unlocked`};
    }

    static async LockVariable(user, orgTeamUser, workspace_id, variableName){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const varColl = await getCollection(DB_VARIABLES);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const _variable = await varColl.findOne({name: variableName, workspace: workspace._id});
        if(!_variable) throw new ApplicationError("Variable not found");

        await varColl.updateOne({_id: _variable._id}, {$set: {locked: true}});
        return {message: `Variable "${_variable.name}" has been locked`};
    }

    static async UnlockVariable(user, orgTeamUser, workspace_id, variableName){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const varColl = await getCollection(DB_VARIABLES);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const _variable = await varColl.findOne({name: variableName, workspace: workspace._id});
        if(!_variable) throw new ApplicationError("Variable not found");

        await varColl.updateOne({_id: _variable._id}, {$unset: {locked: 1}});
        return {message: `Variable "${_variable.name}" has been unlocked`};
    }

    static async LockPollingJob(user, orgTeamUser, workspace_id, polling_job_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const pollColl = await getCollection(DB_POLLING_JOB);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const pollJob = await pollColl.findOne({_id: new ObjectID(polling_job_id), workspace: workspace._id});
        if(!pollJob) throw new ApplicationError("Polling Job not found");

        await pollColl.updateOne({_id: pollJob._id}, {$set: {locked: true}});
        return {message: `Polling Job "${pollJob.name}" has been locked`};
    }

    static async UnlockPollingJob(user, orgTeamUser, workspace_id, polling_job_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const pollColl = await getCollection(DB_POLLING_JOB);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const pollJob = await pollColl.findOne({_id: new ObjectID(polling_job_id), workspace: workspace._id});
        if(!pollJob) throw new ApplicationError("Polling Job not found");

        await pollColl.updateOne({_id: pollJob._id}, {$unset: {locked: 1}});
        return {message: `Polling Job "${pollJob.name}" has been unlocked`};
    }

    static async LockChannel(user, orgTeamUser, workspace_id, channel_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const chColl = await getCollection(DB_CHANNEL);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const channel = await chColl.findOne({_id: new ObjectID(channel_id), workspace: workspace._id});
        if(!channel) throw new ApplicationError("Channel not found");

        await chColl.updateOne({_id: channel._id}, {$set: {locked: true}});
        return {message: `Channel "${channel.name}" has been locked`};
    }

    static async UnlockChannel(user, orgTeamUser, workspace_id, channel_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const chColl = await getCollection(DB_CHANNEL);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const channel = await chColl.findOne({_id: new ObjectID(channel_id), workspace: workspace._id});
        if(!channel) throw new ApplicationError("Channel not found");

        await chColl.updateOne({_id: channel._id}, {$unset: {locked: 1}});
        return {message: `Channel "${channel.name}" has been unlocked`};
    }

    static async LockRule(user, orgTeamUser, workspace_id, rule_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const ruleColl = await getCollection(DB_RULE);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const rule = await ruleColl.findOne({_id: new ObjectID(rule_id), workspace: workspace._id});
        if(!rule) throw new ApplicationError("Rule not found");

        await ruleColl.updateOne({_id: rule._id}, {$set: {locked: true}});
        return {message: `Rule "${rule.name}" has been locked`};
    }

    static async UnlockRule(user, orgTeamUser, workspace_id, rule_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const ruleColl = await getCollection(DB_RULE);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        if(member && member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const rule = await ruleColl.findOne({_id: new ObjectID(rule_id), workspace: workspace._id});
        if(!rule) throw new ApplicationError("Rule not found");

        await ruleColl.updateOne({_id: rule._id}, {$unset: {locked: 1}});
        return {message: `Rule "${rule.name}" has been unlocked`};
    }
}

module.exports = WorkspaceAdmin;