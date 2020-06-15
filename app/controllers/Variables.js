const {DB_VARIABLES, DB_WORKSPACE, DB_WORKSPACE_MEMBERS} = require('../Constants');
const {getCollection} = require('../db');
const {OperationNotAllowedException, ApplicationError} = require('../exceptions');
const ObjectID = require('mongodb').ObjectID;
const {RedisService, UserEventService} = require('../services'); 
const WorkspaceUtility = require('../util/WorkspaceUtility');

class VariablesController{
    static async createVariable(user, orgTeamUser, variableName, value, description, workspace_id){
        if(variableName.indexOf(' ') !== -1) throw new ApplicationError('variable name cannot have spaces');

        const varColl = await getCollection(DB_VARIABLES);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const org_id = user.organization;
        const _workspace_id = new ObjectID(workspace_id);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const varExists = await varColl.findOne({workspace: _workspace_id, name: variableName});
        if(varExists) throw new ApplicationError("Variable already exists");

        const _var = {
            createdBy: user._id,
            lastUpdatedBy: user._id,
            workspace: _workspace_id,
            organization: org_id,
            name: variableName,
            value,
            description,
            created: new Date(),
            updated: new Date()
        };

        await varColl.insertOne(_var);
        await RedisService.saveWorkspaceVariable(
            org_id.toString(), workspace_id, variableName, value
        );
        await RedisService.incrementUsage(org_id.toString(), 'variable_count');
        await UserEventService.userCreatedVariable(user, orgTeamUser, workspace, variableName, value);

        return {message: `Variable ${variableName} created`};
    }

    static async updateVariableValue(user, orgTeamUser, variableName, value, description, workspace_id){
        const varColl = await getCollection(DB_VARIABLES);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const org_id = user.organization;
        const _workspace_id = new ObjectID(workspace_id);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const varExists = await varColl.findOne({workspace: _workspace_id, name: variableName});
        if(!varExists) throw new ApplicationError("Variable not found");

        _workspaceUtility.variable = varExists;
        _workspaceUtility.VerifyVariableIsNotLocked();

        await varColl.updateOne({_id: varExists._id}, {$set: {
            value,
            description,
            lastUpdatedBy: user._id,
            updated: new Date()
        }});

        await RedisService.saveWorkspaceVariable(
            org_id.toString(), workspace_id, variableName, value
        );
        await UserEventService.userUpdatedVariable(user, orgTeamUser, workspace, variableName, value);

        return {message: `Variable ${variableName} updated`};
    }

    static async listVariables(user, orgTeamUser, workspace_id, page = 1, limit = 20, searchTerm = null){
        const varColl = await getCollection(DB_VARIABLES);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const org_id = user.organization;
        const _workspace_id = new ObjectID(workspace_id);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const skip = (page - 1) * limit;
        let where = {workspace: _workspace_id, organization: org_id};
        let sort = {_id: -1};

        if(searchTerm != null && searchTerm != undefined && searchTerm != ''){
            where.name = {$regex: `${searchTerm}`, $options: 'i'};
        }

        const result = await varColl.find(where).skip(skip).limit(limit).sort(sort).toArray();
        const _results = result.map(v => ({
            id: v._id.toString(),
            name: v.name,
            description: v.description,
            value: v.value,
            locked: !!(v.locked && v.locked === true)
        }));

        return {variables: _results};
    }

    static async deleteVariable(user, orgTeamUser, variableName, workspace_id){
        const varColl = await getCollection(DB_VARIABLES);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const org_id = user.organization;
        const _workspace_id = new ObjectID(workspace_id);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const varExists = await varColl.findOne({workspace: _workspace_id, name: variableName});
        if(!varExists) throw new ApplicationError("Variable not found");

        _workspaceUtility.variable = varExists;
        _workspaceUtility.VerifyVariableIsNotLocked();

        await varColl.deleteOne({_id: varExists._id});
        await RedisService.deleteWorkspaceVariable(
            org_id.toString(), workspace_id, variableName
        );
        await RedisService.decrementUsage(org_id.toString(), 'variable_count');
        await UserEventService.userDeletedVariable(user, orgTeamUser, workspace, variableName);

        return {message: `variable ${variableName} deleted`};
    }
}

module.exports = VariablesController;