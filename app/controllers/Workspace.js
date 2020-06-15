const {getCollection} = require('../db');
const {OperationNotAllowedException, ApplicationError} = require('../exceptions');
const ObjectID = require('mongodb').ObjectID;
const {EmailService, RedisService, UserEventService} = require('../services');
const { DB_USER, DB_ORG, DB_WORKSPACE_MEMBERS, DB_WORKSPACE, DB_TEAM,
DB_CHANNEL, DB_RULE, DB_FUNCTIONS, DB_VARIABLES, DB_POLLING_JOB } = require('../Constants');
const WorkspaceUtility = require('../util/WorkspaceUtility');

class Workspace{
    static async createWorkspace(user, orgTeamUser, name, description){
        // user who created workspace automatically added as member
        // also workspace owner
        const wpColl = await getCollection(DB_WORKSPACE);
        const wpMemColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = {
            _id: new ObjectID(),
            name,
            description,
            createdBy: orgTeamUser._id,
            timestamp: new Date(),
            channel_count: 0,
            model_count: 0,
            function_count: 0,
            constants_count: 0,
            organization: user.organization
        };

        const mem = {
            user: orgTeamUser._id,
            workspace: workspace._id,
            organization: user.organization,
            workspace_admin: true,
            workspace_owner: true,
            joined: new Date()
        };

        await wpColl.insertOne(workspace);
        await wpMemColl.insertOne(mem);

        const orgColl = await getCollection(DB_ORG);
        await orgColl.updateOne({_id: user.organization}, {$inc: {workspace_count: 1}});

        await RedisService.incrementUsage(user.organization.toString(), 'workspace_count');
        await UserEventService.userCreatedWorkspace(user, orgTeamUser, workspace);

        return {message: 'Workspace created', id: workspace._id.toString()}
    }

    static async addUserToWorkspace(user, orgTeamUser, workspace_id, team_user_id){
        // only admin and workspace owner can add users
        const userColl = await getCollection(DB_USER);
        const teamColl = await getCollection(DB_TEAM);
        const wpColl = await getCollection(DB_WORKSPACE);
        const wpMemColl = await getCollection(DB_WORKSPACE_MEMBERS);

        if(orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace id invalid');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyChannelIsNotLocked();

        const teamMember = await teamColl.findOne({_id: new ObjectID(team_user_id), organization: user.organization});
        if(!teamMember) throw new ApplicationError('user you are trying to add not found');

        const teamUser = await userColl.findOne({_id: teamMember.user});

        const alreadyAMember = await wpMemColl.findOne({user: teamMember._id, workspace: workspace._id});
        if(alreadyAMember) throw new ApplicationError(`${teamUser.firstname} is already in this workspace`);
        
        const anyoneCanJoin = !!(workspace.public && workspace.public === true);
        if(user._id.toString() === teamMember.user.toString() && anyoneCanJoin === false) throw new ApplicationError("Error. You can't add yourself to this workspace");

        const mem = {
            user: teamMember._id,
            workspace: workspace._id,
            organization: user.organization,
            workspace_admin: false,
            workspace_owner: false,
            joined: new Date()
        };
        await wpMemColl.insertOne(mem);
        await EmailService.AddedToWorkspaceEmail(teamUser.firstname, teamUser.email, user.firstname, workspace.name);
        await UserEventService.userAddedMemberToWorkspace(
            user, orgTeamUser, workspace, teamMember, teamUser, mem
        );

        return {message: `${teamUser.firstname} has been added to this workspace`};
    }

    static async removeUserFromWorkspace(user, orgTeamUser, workspace_id, team_user_id){
        const userColl = await getCollection(DB_USER);
        const teamColl = await getCollection(DB_TEAM);
        const wpColl = await getCollection(DB_WORKSPACE);
        const wpMemColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace id invalid');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();

        const myWorkspaceMembership = await wpMemColl.findOne({
            user: orgTeamUser._id,
            organization: user.organization
        });
        if(!myWorkspaceMembership && orgTeamUser.admin === false) throw new ApplicationError("You are not a member of this workspace");
        if(myWorkspaceMembership.workspace_owner === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const teamMember = await teamColl.findOne({_id: new ObjectID(team_user_id), organization: user.organization});
        if(!teamMember) throw new ApplicationError('user you are trying to remove not found');

        const teamUser = await userColl.findOne({_id: teamMember.user});

        const alreadyAMember = await wpMemColl.findOne({user: teamMember._id, workspace: workspace._id});
        if(!alreadyAMember) throw new ApplicationError(`${teamUser.firstname} is not in this workspace`);

        await wpMemColl.deleteOne({_id: alreadyAMember._id, workspace: workspace._id});
        await EmailService.RemovedFromWorkspaceEmail(teamUser.firstname, teamUser.email, user.firstname, workspace.name);
        await UserEventService.userRemovedMemberFromWorkspace(
            user, orgTeamUser, workspace, teamMember, teamUser, alreadyAMember
        );

        return {message: `${teamUser.firstname} has been removed from this workspace`};
    }

    static async changeWorkspaceOwner(user, orgTeamUser, workspace_id, team_user_id){
        // only admin can do this, new owner would be added as member of workspace if they were not member already
        const userColl = await getCollection(DB_USER);
        const teamColl = await getCollection(DB_TEAM);
        const wpColl = await getCollection(DB_WORKSPACE);
        const wpMemColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace id invalid');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();

        const myWorkspaceMembership = await wpMemColl.findOne({
            user: orgTeamUser._id,
            organization: user.organization
        });
        if(!myWorkspaceMembership && orgTeamUser.admin === false) throw new ApplicationError("You are not a member of this workspace");
        if(myWorkspaceMembership.workspace_owner === false && orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const teamMember = await teamColl.findOne({_id: new ObjectID(team_user_id), organization: user.organization});
        if(!teamMember) throw new ApplicationError('user you are trying to add not found');

        const teamUser = await userColl.findOne({_id: teamMember.user});

        const alreadyAMember = await wpMemColl.findOne({user: teamMember._id, workspace: workspace._id});
        if(!alreadyAMember){
            throw new ApplicationError("Only a member of this workspace can be upgraded to own the workspace");
        }

        await wpMemColl.updateOne({_id: myWorkspaceMembership._id}, {$set: {workspace_owner: false, workspace_admin: false} });
        await wpMemColl.updateOne({_id: alreadyAMember._id}, {$set: {workspace_owner: true, workspace_admin: true} });

        return {message: `${teamUser.firstname} has been assigned as new owner of "${workspace.name}" workspace`};

    }

    static async listUsersInWorkspace(user, orgTeamUser, workspace_id, page = 1, limit = 50){
        // returns name and picture of each user
        // only if I'm a member of the workspace as well
        const userColl = await getCollection(DB_USER);
        const teamColl = await getCollection(DB_TEAM);
        const wpColl = await getCollection(DB_WORKSPACE);
        const wpMemColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace id invalid');

        // For now everyone should be able to see members of any valid workspace in their org that they
        // have access to on the frontend
        //const teamMember = await wpMemColl.findOne({user: orgTeamUser._id, organization: user.organization});
        //if(!teamMember && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');
        
        const skip = (page - 1) * limit;
        const members = await wpMemColl.find({organization: user.organization, workspace: workspace._id}).limit(limit).skip(skip).sort({_id: -1}).toArray();
        const teamUsersIds = members.map(m => m.user);
        const teamUsers = await teamColl.find({_id: {$in: teamUsersIds}}).toArray();
        const usersIds = teamUsers.map(u => u.user);
        const users = await userColl.find({_id: {$in: usersIds}}).toArray();

        const result = members.map(m => {
            const teamUser = teamUsers.find(t => t._id.toString() === m.user.toString() );
            const user = users.find(s => s._id.toString() === teamUser.user.toString());
            const member = {
                id: teamUser._id.toString(),
                first_name: user.firstname,
                last_name: user.lastname,
                photo: user.photo.url
            };
            return member;
        });

        return {members: result};
    }

    static async listWorkspaces(user, orgTeamUser){
        // only workspaces I've been added to except I'm an admin
        const wpColl = await getCollection(DB_WORKSPACE);
        const wpMemColl = await getCollection(DB_WORKSPACE_MEMBERS);

        let where = {};
        if(orgTeamUser.admin === true){
            where = {organization: user.organization};
        }else{
            const myworkspaces = await wpMemColl.find({user: orgTeamUser._id, organization: user.organization}).toArray();
            const wsIds = myworkspaces.map(m => m.workspace);
            where = {_id: {$in: wsIds}};
        }
        const workspaces = await wpColl.find(where).toArray();
        const result = workspaces.map(w => ({
            name: w.name,
            id: w._id.toString(),
            description: w.description,
            locked: !!(w.locked && w.locked === true)
        }));

        return {workspaces: result};
    }

    static async deleteWorkspace(user, orgTeamUser, workspace_id){
        // only admin and workspace owner can delete workspace 
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const teamColl = await getCollection(DB_TEAM);
        const userColl = await getCollection(DB_USER);

        // only orgadmin, workspace_admin can do this
        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace id invalid');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');
        if(member.workspace_admin === false && orgTeamUser.admin === false) throw new OperationNotAllowedException("Insufficient permission");

        // channels in workspace
        const channelColl = await getCollection(DB_CHANNEL);
        const ruleColl = await getCollection(DB_RULE);
        const varColl = await getCollection(DB_VARIABLES);
        const funcColl = await getCollection(DB_FUNCTIONS);
        const pollColl = await getCollection(DB_POLLING_JOB);

        const channelsInWorkspaceWhere = {workspace: workspace._id, organization: user.organization};
        const rulesInWorkspaceWhere = {workspace: workspace._id, organization: user.organization};
        const variablesInWorkspaceWhere = {workspace: workspace._id, organization: user.organization};
        const functionsInWorkspaceWhere = {workspace: workspace._id, organization: user.organization};
        const pollingJobsInWorkspaceWhere = {workspace: workspace._id, organization: user.organization};
        const membersWhere = {workspace: workspace._id, organization: user.organization};

        // count all business objects in this workspace
        const totalChannels = await channelColl.countDocuments(channelsInWorkspaceWhere);
        const totalRules = await ruleColl.countDocuments(rulesInWorkspaceWhere);
        const totalVariables = await varColl.countDocuments(variablesInWorkspaceWhere);
        const totalFunctions = await funcColl.countDocuments(functionsInWorkspaceWhere);
        const totalPollingJobs = await pollColl.countDocuments(pollingJobsInWorkspaceWhere);

        // delete all business objects in this workspace
        await varColl.deleteMany(variablesInWorkspaceWhere);
        await funcColl.deleteMany(functionsInWorkspaceWhere);
        await pollColl.deleteMany(pollingJobsInWorkspaceWhere);

        const r_org_id = user.organization.toString();
        await RedisService.decrementUsage(r_org_id, 'workspace_count');

        if(totalPollingJobs > 0) await RedisService.decrementUsage(r_org_id, 'polling_job_count', totalPollingJobs * -1);
        if(totalVariables > 0) await RedisService.decrementUsage(r_org_id, 'variable_count', totalVariables * -1);
        if(totalFunctions > 0) await RedisService.decrementUsage(r_org_id, 'function_count', totalFunctions * -1);
        if(totalChannels > 0) await RedisService.decrementUsage(r_org_id, 'channel_count', totalChannels * -1);
        if(totalRules > 0) await RedisService.decrementUsage(r_org_id, 'rule_count', totalRules * -1);

        await RedisService.deleteAllWorkspaceFunctions(r_org_id, workspace._id.toString());
        await RedisService.deleteAllWorkspaceVariables(r_org_id, workspace._id.toString());
        
        
        const w_channels = await channelColl.find(channelsInWorkspaceWhere).toArray();
        const w_id = workspace._id.toString();
        for(let x = 0; x < w_channels.length; x++){
            const w_channel = w_channels[x];
            await RedisService.deleteAllChannelRules(r_org_id, w_id, w_channel.slug);
            await RedisService.deleteChannel(r_org_id, w_id, w_channel.slug);
        }
        await channelColl.deleteMany(channelsInWorkspaceWhere);
        await ruleColl.deleteMany(rulesInWorkspaceWhere);

        const workspaceMembers = await memColl.find(membersWhere).toArray();
        const orgTeamIds = workspaceMembers.map(wm => wm.user);
        const orgMembers = await teamColl.find({_id: {$in: orgTeamIds}}).toArray();
        const workspaceMemberUsers = await userColl.find({_id: {$in: orgMembers.map(om => om.user) }}).toArray();

        const usersInWorkspace = workspaceMemberUsers.map(_user => ({
            id: _user._id.toString(),
            firstname: _user.firstname,
            lastname: _user.lastname,
            email: _user.email
        }));
        
        await EmailService.WorkspaceDeleted(usersInWorkspace, workspace.name, user.firstname);

        await memColl.deleteMany(membersWhere);
        await wpColl.deleteOne({_id: workspace._id});

        await UserEventService.userDeletedWorkspace(user, orgTeamUser, workspace);

        return {
            message: `Workspace "${workspace.name}" has been deleted`
        };
    }

    static async listPendingWorkspaceDeletions(user, orgTeamUser){
        const deletionColl = await getCollection(DB_SCHEDULED_DELETION);
        const pendings = await deletionColl.find({organization: user.organization})
        .sort({_id: -1}).toArray();

        const workspace_ids = pendings.map(p => p.workspace);

        const wpColl = await getCollection(DB_WORKSPACE);
        const workspaces = await wpColl.find({_id: {$in: workspace_ids}})
        .sort({name: 1}).toArray();

        const result = workspaces.map(workspace => ({
            id: workspace._id.toString(),
            name: workspace.name
        }));

        return {
            workspaces_pending_deletion: result
        };
    }

    static async cancelPendingWorkspaceDeletion(user, orgTeamUser, workspace_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const deletionColl = await getCollection(DB_SCHEDULED_DELETION);

        // only orgadmin, workspace_admin can do this
        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace id invalid');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');
        if(member.workspace_admin === false && orgTeamUser.admin === false) throw new ApplicationError("Insufficient permission");

        const isPendingDeletion = await deletionColl.findOne({
            workspace: workspace._id,
            organization: user.organization
        });

        if(!isPendingDeletion) throw new ApplicationError("This workspace is not scheduled for deletion");

        await deletionColl.deleteOne({_id: isPendingDeletion._id});

        // notify members that workspace is no longer being deleted

        return {
            message: `Workspace "${workspace.name}" deletion has been cancelled`
        };
    }

    static async updateWorkspace(user, orgTeamUser, workspace_id, name, description){
        // name, description
        const userColl = await getCollection(DB_USER);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace id invalid');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();


        await wpColl.updateOne({_id: workspace._id}, {$set: {name, description}});
        await UserEventService.userModifiedWorkspaceMeta(user, orgTeamUser, workspace);

        return {message:`"${name}" workspace has been updated`};

    }

    static async getUsersWorkspaceMembership(user, orgTeamUser, workspace_id){
        const wpColl = await getCollection(DB_WORKSPACE);
        const wpMemColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace id invalid');

        let workspace_admin = false;
        let workspace_owner = false;
        let workspace_member = false;

        const myWorkspaceMembership = await wpMemColl.findOne({
            user: orgTeamUser._id,
            organization: user.organization
        });

        if(!myWorkspaceMembership && orgTeamUser.admin === true){
            workspace_admin = true;
            workspace_owner = false;
            workspace_member = false;
        }

        if(myWorkspaceMembership){
            workspace_admin = myWorkspaceMembership.workspace_admin;
            workspace_owner = myWorkspaceMembership.workspace_owner;
            workspace_member = true;
        }

        const resp = {
            workspace_name: workspace.name,
            workspace_admin,
            workspace_owner,
            workspace_member
        };

        return {
            membership: resp
        };
    }
}

module.exports = Workspace;