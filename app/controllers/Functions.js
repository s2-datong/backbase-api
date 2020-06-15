const {DB_FUNCTIONS, DB_WORKSPACE, DB_WORKSPACE_MEMBERS} = require('../Constants');
const {getCollection} = require('../db');
const {OperationNotAllowedException, ApplicationError} = require('../exceptions');
const ObjectID = require('mongodb').ObjectID;
const {RedisService} = require('../services');
const parser = require('../../modules/createfunctionparser');
const WorkspaceUtility = require('../util/WorkspaceUtility');
 
class FunctionsController{
    static async createFunction(user, orgTeamUser, functionString, description, workspace_id){

        try{
            let func = functionString.replace(/\n/g, '').trim();
            let body = `return ${func};`;
            var _f = new Function(body)();
        }
        catch(e){
            throw new ApplicationError(`Error Creating function: ${e.message}`);
        }
        const functionColl = await getCollection(DB_FUNCTIONS);
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

        const _functionParts = parser.parse(functionString);
        const functionName = _functionParts.functionName;

        const functionSlug = functionName;
        const funcExists = await functionColl.findOne({slug: functionSlug, workspace: _workspace_id, organization: org_id});
        if(funcExists) throw new ApplicationError("A Function with that name already exists");

        let func = functionString.replace(/\n/g, '').trim();
        let body = `return ${func};`;

        const _function = {
            _id: new ObjectID(),
            createdBy: user._id,
            lastUpdatedBy: user._id,
            organization: org_id,
            workspace: _workspace_id,
            slug: functionSlug,
            name: functionName,
            description,
            body
        };

        await functionColl.insertOne(_function);
        await RedisService.saveWorkspaceFunction(org_id.toString(), workspace_id, functionName, functionString);
        await RedisService.incrementUsage(org_id.toString(), 'function_count');

        return {message: `Function ${functionName} created`};
    }

    static async deleteFunction(user, orgTeamUser, functionName, workspace_id){
        const functionColl = await getCollection(DB_FUNCTIONS);
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

        const funcExists = await functionColl.findOne({name: functionName, workspace: _workspace_id, organization: org_id});
        if(!funcExists) throw new ApplicationError("Function Not found");

        _workspaceUtility.function = funcExists;
        _workspaceUtility.VerifyFunctionIsNotLocked();

        await functionColl.deleteOne({name: functionName, workspace: _workspace_id, organization: org_id})
        await RedisService.deleteWorkspaceFunction(org_id.toString(), workspace_id, functionName);
        await RedisService.decrementUsage(org_id.toString(), 'function_count');

        return {message: `Function ${functionName} deleted`};
    }

    static async updateFunction(user, orgTeamUser, function_id, functionString, description, workspace_id){

        try{
            let func = functionString.replace(/\n/g, '').trim();
            let body = `return ${func};`;
            const _f = new Function(body)();
        }
        catch(e){
            throw new ApplicationError(`Error Creating function: ${e.message}`);
        }

        const functionColl = await getCollection(DB_FUNCTIONS);
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

        const _functionParts = parser.parse(functionString);
        const functionName = _functionParts.functionName;

        const functionSlug = functionName;
        const funcExists = await functionColl.findOne({_id: new ObjectID(function_id), workspace: _workspace_id, organization: org_id});
        if(!funcExists) throw new ApplicationError("Function Not found");

        const functioNameAlreadyExists = await functionColl.findOne({
            name: functionName, _id: {$ne: funcExists._id}
        });

        if(functioNameAlreadyExists) throw new ApplicationError(`Another function with this name "${functionName}" already exists`);

        _workspaceUtility.function = funcExists;
        _workspaceUtility.VerifyFunctionIsNotLocked();

        let func = functionString.replace(/\n/g, '').trim();
        let body = `return ${func};`;

        let sett = {$set: {
            lastUpdatedBy: user._id,
            slug: functionSlug,
            name: functionName,
            description,
            body
        }};

        await functionColl.updateOne({_id: funcExists._id}, sett);
        let msg = "";
        if(functionName == funcExists.name){
            await RedisService.saveWorkspaceFunction(org_id.toString(), workspace_id, functionName, functionString);
            msg = `Function ${functionName} updated`;
        }
        else{
            await RedisService.deleteWorkspaceFunction(org_id.toString(), workspace_id, funcExists.name);
            await RedisService.saveWorkspaceFunction(org_id.toString(), workspace_id, functionName, functionString);
            msg = `Function ${funcExists.name} renamed to ${functionName}`;
        }

        return {message: msg};
    }

    static async listFunctions(user, orgTeamUser, workspace_id, page = 1, limit = 20, searchTerm = null){
        const functionColl = await getCollection(DB_FUNCTIONS);
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

        const result = await functionColl.find(where).skip(skip).limit(limit).sort(sort).toArray();
        const _results = result.map(f => ({
            id: f._id.toString(),
            name: f.name,
            description: f.description,
            body: f.body,
            locked: !!(f.locked && f.locked === true)
        }));

        return {functions: _results};
    }
}

module.exports = FunctionsController;