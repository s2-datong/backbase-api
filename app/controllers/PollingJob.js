const {DB_POLLING_JOB, DB_WORKSPACE, DB_WORKSPACE_MEMBERS, DB_CHANNEL} = require('../Constants');
const {getCollection} = require('../db');
const {ApplicationError} = require('../exceptions');
const {RedisService, JobSchedulerService} = require('../services');
const ObjectID = require('mongodb').ObjectID;
const parseDuration = require('parse-duration');
const WorkspaceUtility = require('../util/WorkspaceUtility');

function timestr(str){
    if(/^every ([0-9]+) (days|hours|minutes)$/i.test(str)){
        const match = str.match(/^every ([0-9]+) (days|hours|minutes)$/i);
        const interval = parseInt(match[1]);
        const period = match[2];

        let d = {
            days: period == "days" ? interval : 0,
            hours: period == "hours" ? interval : 0,
            minutes: period == "minutes" ? interval : 0
        };

        return d;
    }

    if(/^every (day|hour|minute)$/i.test(str)){
        const match = str.match(/^every (day|hour|minute)$/i);
        const period = match[1];

        let d = {
            days: period == "day" ? "*" : 0,
            hours: period == "hour" ? "*" : 0,
            minutes: period == "minute" ? "*" : 0
        };

        return d;
    }

    return null;
}

class PollingJob{
    static async createPollingJob(user, orgTeamUser, workspace_id, name, description, 
        getEndpoint, postEndpoint, hashSecret, channel_id, interval, queue){
        const pollColl = await getCollection(DB_POLLING_JOB);

        if(queue !== "simple" && queue !== "stream"){
            throw new ApplicationError("An invalid queue specified. Expected 'simple' or 'stream'");
        }

        // validate interval
        const jobinterval = timestr(interval.trim());
        if(jobinterval == null) throw new ApplicationError("The interval specified is invalid. Expected (every hour / every 6 minutes etc)");
        
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

        const channelColl = await getCollection(DB_CHANNEL);
        const channel = await channelColl.findOne({
            _id: new ObjectID(channel_id),
            workspace: _workspace_id
        });

        if(!channel) throw new ApplicationError("Invalid channel selected")

        const exists = await pollColl.findOne({
            name: name, workspace: _workspace_id
        });

        if(exists) throw new ApplicationError('A Polling service with this name already exists')

        const pollService = {
            _id: new ObjectID(),
            createdBy: user._id,
            lastUpdatedBy: user._id,
            organization: org_id,
            name,
            description,
            getEndpoint,
            postEndpoint,
            hashSecret,
            channel: channel._id,
            workspace: _workspace_id,
            interval,
            status: 'active',
            queue,
            created: new Date(),
            updated: new Date()
        }

        await pollColl.insertOne(pollService);
        await JobSchedulerService.addJob(org_id.toString(), pollService._id.toString(), queue, jobinterval);
        await RedisService.incrementUsage(org_id.toString(), 'polling_job_count');
        return {message: 'Polling Service created'};
    }

    static async listPollingJobs(user, orgTeamUser, workspace_id, page = 1, limit = 20, searchTerm = null){
        const pollColl = await getCollection(DB_POLLING_JOB);

        const wpColl = await getCollection(DB_WORKSPACE);
        const memColl = await getCollection(DB_WORKSPACE_MEMBERS);
        const channelColl = await getCollection(DB_CHANNEL);
        const org_id = user.organization;
        const _workspace_id = new ObjectID(workspace_id);

        const workspace = await wpColl.findOne({_id: new ObjectID(workspace_id), organization: user.organization});
        if(!workspace) throw new ApplicationError('Workspace not found');

        const member = await memColl.findOne({user: orgTeamUser._id, workspace: workspace._id});
        if(!member && orgTeamUser.admin === false) throw new ApplicationError('You are not a member of this workspace');

        const where = {workspace: _workspace_id, organization: user.organization};
        const skip = (page - 1) * limit;
        const sort = {_id: -1};
        if(searchTerm != null) where.name = {$regex: `${searchTerm}`, $options: 'i'};

        const polls = await pollColl.find(where).skip(skip).limit(limit).sort(sort).toArray();
        const p_channels = polls.map(p => p.channel);
        const _channels = await channelColl.find({_id: {$in: p_channels}}).toArray();

        const _polls = polls.map(p => {
            const _id = p.channel.toString();
            const channel = _channels.find(c => c._id.toString() === _id );
            const p_chan = {
                id: p._id.toString(),
                channel: {
                    id: _id,
                    name: channel.name,
                    slug: channel.slug
                },
                name: p.name,
                description: p.description,
                getEndpoint: p.getEndpoint,
                postEndpoint: p.postEndpoint,
                interval: p.interval,
                locked: !!(p.locked && p.locked === true),
                queue: p.queue
            };

            return p_chan;
        });

        return {polling_services: _polls};
    }

    static async updatePollingJob(user, orgTeamUser, workspace_id, pollingJobId, name, description,
        getEndpoint, postEndpoint, hashSecret, channel_id, interval, queue ){
            
            let jobinterval;
            const pollColl = await getCollection(DB_POLLING_JOB);

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

            const pollId = new ObjectID(pollingJobId);
            const pollJob = await pollColl.findOne({_id: pollId, workspace: _workspace_id});
            if(!pollJob) throw new ApplicationError("Polling Job not found");

            _workspaceUtility.polling_job = pollJob;
            _workspaceUtility.VerifyPollingJobIsNotLocked();

            const sett = {$set: {}};
            if(name && name != '') sett.$set.name = name;
            if(description && description != '') sett.$set.description = description;
            if(getEndpoint && getEndpoint != '') sett.$set.getEndpoint = getEndpoint;
            if(postEndpoint && postEndpoint != '') sett.$set.postEndpoint = postEndpoint;
            if(hashSecret && hashSecret != '') sett.$set.hashSecret = hashSecret;
            if(interval && interval != ''){
                jobinterval = timestr(interval.trim());
                if(jobinterval == null) throw new ApplicationError("The interval specified is invalid. Expected (every hour / every 6 minutes etc)");
                sett.$set.interval = interval;
            }
            if(queue && queue != ''){
                if(queue !== "simple" && queue !== "stream"){
                    throw new ApplicationError("An invalid queue specified. Expected 'simple' or 'stream'");
                }
                sett.$set.queue = queue;
            }

            if(channel_id && channel_id != ''){
                const channelColl = await getCollection(DB_CHANNEL);
                const channel = await channelColl.findOne({_id: new ObjectID(channel_id), workspace: _workspace_id});
                if(!channel) throw new ApplicationError('Channel not found in this workspace');

                sett.$set.channel = channel._id;
            }

            const updatedKeys = Object.keys(sett.$set);
            if(updatedKeys.length > 0){
                await pollColl.updateOne({_id: pollId}, sett);

                if(sett.$set.interval){
                    await JobSchedulerService.updateJob(
                        org_id.toString(), pollId.toString(), queue, jobinterval
                    );
                }
            }
            return {message: `Poll Job ${pollJob.name} has been updated`};
    }

    static async deletePollingJob(user, orgTeamUser, workspace_id, pollingJobId){
        const pollColl = await getCollection(DB_POLLING_JOB);

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

        const pollId = new ObjectID(pollingJobId);
        const pollJob = await pollColl.findOne({_id: pollId, workspace: _workspace_id});
        if(!pollJob) throw new ApplicationError("Polling Job not found in this workspace");

        _workspaceUtility.polling_job = pollJob;
        _workspaceUtility.VerifyPollingJobIsNotLocked();

        await pollColl.deleteOne({_id: pollId});
        await JobSchedulerService.deleteJob(org_id.toString(), pollId.toString());
        await RedisService.decrementUsage(org_id.toString(), 'polling_job_count');
        return {message: `Poll Job ${pollJob.name} has been deleted`};
    }
}

module.exports = PollingJob;