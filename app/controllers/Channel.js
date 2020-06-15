const {getCollection} = require('../db');
const { ApplicationError} = require('../exceptions');
const ObjectID = require('mongodb').ObjectID;
const {RedisService} = require('../services');
const { DB_WORKSPACE_MEMBERS, DB_WORKSPACE, DB_CHANNEL, DB_RULE } = require('../Constants');
const ruleLinter = require('../../modules/syntaxlinter');
const WorkspaceUtility = require('../util/WorkspaceUtility');

class Channel{
    static async  createChannel(user, orgTeamUser, workspace_id, name, description){
        // must be created in a workspace
        const chColl = await getCollection(DB_CHANNEL);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const channelSlug = name.replace(/ /g, '_').trim().toLowerCase();
        const channelExists = await chColl.findOne({slug: channelSlug, organization: user.organization});
        if(channelExists) throw new ApplicationError("A Channel with this name already exists either in this workspace or another workspace. Channel names must be unique across all workspaces");

        const channel = {
            _id: new ObjectID(),
            name,
            slug: channelSlug,
            description,
            createdBy: user._id,
            workspace: workspace._id,
            rule_count: 0,
            organization: user.organization,
            timestamp: new Date()
        };

        await chColl.insertOne(channel);
        await wpColl.updateOne({_id: workspace._id}, {$inc: {channel_count: 1}});

        await RedisService.saveChannel(
            user.organization.toString(),
            workspace_id, channelSlug
        );

        return {message: 'Channel created', id: channel._id.toString(), slug: channelSlug};
    }

    static async  listChannels(user, orgTeamUser, workspace_id, page = 1, limit = 50){
        // must provide workspace id
        const skip = ( page - 1) * limit;

        const chColl = await getCollection(DB_CHANNEL);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const channels = await chColl.find({organization: user.organization})
        .limit(limit).skip(skip).sort({_id: -1}).toArray();

        const _channels = channels.map(c => ({
                id: c._id.toString(),
                name: c.name,
                description: c.description,
                locked: !!(c.locked && c.locked === true)
            })
        );
        return {channels: _channels};
    }

    static async  updateChannel(user, orgTeamUser, workspace_id, channel_id, name, description){
        // name, description
        const chColl = await getCollection(DB_CHANNEL);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const channel = await chColl.findOne({_id: new ObjectID(channel_id), workspace: workspace._id});
        if(!channel) throw new ApplicationError('Channel not found');

        _workspaceUtility.channel = channel;
        _workspaceUtility.VerifyChannelIsNotLocked();

        let toUpdate = false;
        let sett = {$set: {}};

        if(name != null && name != undefined && name != ''){
            const channelSlug = name.replace(/ /g, '_').trim();
            const channelExists = await chColl.findOne({slug: channelSlug, organization: user.organization});
            if(channelExists) throw new ApplicationError("A Channel with this name already exists");

            sett.$set.name = name; 
            sett.$set.slug = channelSlug;
            toUpdate = true;
        }
        if(description != null && description != undefined && description != '') sett.$set.description = description; toUpdate = true;

        if(toUpdate === true){
            await chColl.updateOne({_id: channel._id}, sett);
        }

        return {message: 'Channel has been successfully updated'};

    }

    static async  deleteChannel(user, orgTeamUser, workspace_id, channel_id){
        const chColl = await getCollection(DB_CHANNEL);
        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const ruleCol = await getCollection(DB_RULE);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const _workspaceUtility = new WorkspaceUtility();
        _workspaceUtility.workspace = workspace;
        _workspaceUtility.VerifyWorkspaceIsNotReadOnly();
        _workspaceUtility.VerifyWorkspaceIsNotLocked();

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const channel = await chColl.findOne({_id: new ObjectID(channel_id), workspace: workspace._id});
        if(!channel) throw new ApplicationError('Channel not found');

        _workspaceUtility.channel = channel;
        _workspaceUtility.VerifyChannelIsNotLocked();

        await ruleCol.deleteMany({channel: channel._id, workspace: workspace._id});
        await chColl.deleteOne({_id: channel._id});

        await RedisService.deleteAllChannelRules(
            user.organization.toString(),
            workspace_id, channel.slug
        );
        await RedisService.deleteChannel(
            user.organization.toString(), 
            workspace_id, channel.slug
        );

        await wpColl.updateOne({_id: workspace._id}, {$inc: {channel_count: -1}});

        return {mesage: 'Channel has been deleted', id: channel_id};
    }

    static async  describeChannel(api_key, channel_slug){
        
        const orgCol = await getCollection(DB_ORG);
        const org = await orgCol.findOne({$or: [
            {"api_key.public": api_key},
            {"api_key.secret": api_key}
        ]});

        if(!org) throw new ApplicationError('Invalid APIKey provided');

        const chCol = await getCollection(DB_CHANNEL);
        const channel = await chCol.findOne({slug: channel_slug, organization: org._id});

        if(!channel) throw new ApplicationError("Channel not found in this organization");

        const ruleCol = await getCollection(DB_RULE);
        const rules = await ruleCol.find({channel: channel._id, workspace: channel.workspace}).sort({index: 1}).toArray();

        const _rules = rules.map(r => r.rule);
        const _SET = new Set();
        for(let i = 0; i < _rules.length; i++){
            const _rule = _rules[i];
            const variables = ruleLinter.parse(_rule);
            for(let x in variables){
                const _variable = variables[x];
                _SET.add(_variable);
            }
        }

        const _allVar = [..._SET];
        const allWorkspaceVariables = await RedisService.getAllVariables(
            org._id.toString(), channel.workspace.toString()
        );
        const allWorkspaceVariablesKeys = Object.keys(allWorkspaceVariables);

        const result = {
            workspace_variables: [],
            payload_variables: []
        };
        for(let x = 0; x < _allVar.length; x++){
            const _var = _allVar[x];
            if(allWorkspaceVariablesKeys.indexOf(_var) !== -1){
                // this _var is a workspace variable
                result.workspace_variables.push(_var);
            }else{
                // include in payload
                result.payload_variables.push(_var);
            }
        }

        return {model: result};
    }
}

module.exports = Channel;