const {getCollection} = require('../db');
const { ApplicationError} = require('../exceptions');
const config = require('../../config');
const ObjectID = require('mongodb').ObjectID;
const { RedisService, UserBillingService } = require('../services');
const { DB_WORKSPACE_MEMBERS, DB_WORKSPACE, DB_CHANNEL, DB_RULE } = require('../Constants');
const parser = require('../../modules/syntaxlinter');
const WorkspaceUtility = require('../util/WorkspaceUtility');

class Rule{
    static async createRule(user, orgTeamUser, workspace_id, channel_id, rule, index = null, title = 'New Rule', description = 'New Rule'){

        try{
            parser.parse(rule);
        }
        catch(e){
            throw new ApplicationError(e.message);
        }
        const ruleCol = await getCollection(DB_RULE);
        const wpColl = await getCollection(DB_WORKSPACE);
        const chColl = await getCollection(DB_CHANNEL);
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

        const count = await ruleCol.countDocuments({channel: channel._id, workspace: workspace._id});
        if(index != null && Number.isInteger(index)){
            const _rWithIndex = await ruleCol.findOne({channel: channel._id, workspace: workspace._id, index});
            if(_rWithIndex) throw new ApplicationError("Another Rule is already using this index.")
        }

        let maxIndex = count;
        if(count > 0){
            const maxIndexRule = await ruleCol.find({channel: channel._id, workspace: workspace._id}).limit(1).sort({index: -1}).toArray();
            maxIndex = maxIndexRule[0].index + 1;
        }

        const _index = Number.isInteger(index) ? index : maxIndex;

        const _rule = {
            channel: channel._id,
            workspace: workspace._id,
            rule: rule,
            index: _index,
            title,
            description,
            createdBy: user._id,
            timestamp: new Date()
        };

        await ruleCol.insertOne(_rule);
        await chColl.updateOne({_id: channel._id}, {$inc: {rule_count: 1}});

        await RedisService.saveChannelRule(user.organization.toString(), workspace_id, channel.slug, rule, _index);
        await RedisService.incrementUsage(user.organization.toString(), 'rule_count');
        return {message: 'Rule created'};
    }

    static async listRules(user, orgTeamUser, workspace_id, channel_id){
        // workspace and channel
        const ruleCol = await getCollection(DB_RULE);
        const wpColl = await getCollection(DB_WORKSPACE);
        const chColl = await getCollection(DB_CHANNEL);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const channel = await chColl.findOne({_id: new ObjectID(channel_id), workspace: workspace._id});
        if(!channel) throw new ApplicationError('Channel not found');

        const _allRules = await ruleCol.find({channel: channel._id, workspace: workspace._id}).sort({index: 1}).toArray();
        const _allRulesArr = _allRules.map(r => ({
            id: r._id.toString(),
            rule: r.rule,
            title: r.title,
            description: r.description,
            index: r.index,
            locked: !!(r.locked && r.locked === true)
        }));

        return {rules: _allRulesArr};
    }

    static async updateRule(user, orgTeamUser, workspace_id, channel_id, rule_id, rule = null, index = null, title = null, description = null){
        if(rule != null){
            try{
                parser.parse(rule);
            }
            catch(e){
                throw new ApplicationError(e.message);
            }
        }
        const ruleCol = await getCollection(DB_RULE);
        const wpColl = await getCollection(DB_WORKSPACE);
        const chColl = await getCollection(DB_CHANNEL);
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

        const _rule = await ruleCol.findOne({_id: new ObjectID(rule_id), channel: channel._id, workspace: workspace._id});
        if(!_rule) throw new ApplicationError('Invalid Rule ID');

        _workspaceUtility.rule = _rule;
        _workspaceUtility.VerifyRuleIsNotLocked();

        if(Number.isInteger(index)){
            const _ruleIndex = await ruleCol.findOne({
                channel: channel._id, workspace: workspace._id,
                index: index, _id: {$ne: _rule._id}
            });

            if(_ruleIndex) throw new ApplicationError('Another Rule already has this index');
        }

        let toupdate = false;
        let updatedRuleOrIndex = false;
        let updatedIndex = false;
        let updatedRule = false;
        let sett = { $set: {}};

        if(rule != null && rule != '' && rule !== _rule.rule){
            // rule linted above
            sett.$set.rule = rule; 
            toupdate = true; 
            updatedRuleOrIndex = true;
            updatedRule = true;
        }
        if(Number.isInteger(index) && _rule.index !== index){
            sett.$set.index = index; 
            toupdate = true; 
            updatedRuleOrIndex = true; 
            updatedIndex = true;
        }
        if(title != null && title != ''){
            sett.$set.title = title; 
            toupdate = true;
        }
        if(description != null && description != ''){
            sett.$set.description = description; 
            toupdate = true;
        }

        if(toupdate === true){
            await ruleCol.updateOne({_id: _rule._id}, sett);
        }

        if(updatedRuleOrIndex === true){
            if(updatedIndex === true && updatedRule === false){
                const oldIndex = _rule.index;
                await RedisService.deleteChannelRule(
                    user.organization.toString(), 
                    workspace_id, channel.slug, oldIndex
                );
                await RedisService.saveChannelRule(
                    user.organization.toString(), 
                    workspace_id, channel.slug, _rule.rule, index
                );
            }
            else if(updatedIndex === false && updatedRule === true){
                await RedisService.saveChannelRule(
                    user.organization.toString(), 
                    workspace_id, channel.slug, _rule.index, rule
                );
            }
            else if(updatedIndex === true && updatedRule === true){
                const oldIndex = _rule.index;
                await RedisService.deleteChannelRule(
                    user.organization.toString(), 
                    workspace_id, channel.slug, oldIndex
                );
                await RedisService.saveChannelRule(
                    user.organization.toString(), 
                    workspace_id, channel.slug, rule, index
                );
            }
        }

        return {message: 'Rule updated'};
    }

    static async deleteRule(user, orgTeamUser, workspace_id, channel_id, rule_id){
        const ruleCol = await getCollection(DB_RULE);
        const wpColl = await getCollection(DB_WORKSPACE);
        const chColl = await getCollection(DB_CHANNEL);
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

        const _rule = await ruleCol.findOne({_id: new ObjectID(rule_id), channel: channel._id, workspace: workspace._id});
        if(!_rule) throw new ApplicationError('Invalid Rule ID');

        _workspaceUtility.rule = _rule;
        _workspaceUtility.VerifyRuleIsNotLocked();

        await ruleCol.deleteOne({_id: _rule._id});
        await RedisService.deleteChannelRule(
            user.organization.toString(), 
            workspace_id, channel.slug, _rule.index
        );
        await RedisService.decrementUsage(user.organization.toString(), 'rule_count');
        await chColl.updateOne({_id: channel._id}, {$inc: {rule_count: -1}});

        return {message: 'Rule deleted', id: _rule._id};
    }

    static async isRuleIndexValid(user, orgTeamUser, workspace_id, channel_id, index){
        const ruleCol = await getCollection(DB_RULE);
        const rule = await ruleCol.findOne({
            workspace: new ObjectID(workspace_id),
            channel: new ObjectID(channel_id),
            index
        });
        
        if(rule){
            return {valid: false};
        }
        return {valid: true};
    }

    static async returnNextValidRuleIndex(user, orgTeamUser, workspace_id, channel_id){
        const ruleCol = await getCollection(DB_RULE);
        const maxIndexRule = await ruleCol.find({
            channel: new ObjectID(channel_id),
            workspace: new ObjectID(workspace_id)
        }).limit(1).sort({index: -1}).toArray();

        if(maxIndexRule.length === 0){
            return {index: 0};
        }
        const maxIndex = maxIndexRule[0].index + 1;
        return {index: maxIndex};
    }
}

module.exports = Rule;