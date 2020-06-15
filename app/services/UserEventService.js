const axios = require('axios');
const config = require('../../config');

async function send(uevent){
    const event_service_url = config.service.events.url;
    try{
        await axios.post(event_service_url, uevent, {
            headers: {
                'Content-type': 'application/json'
            }
        });
    }
    catch(e){
        // TODO: Log error to sentry but fail silently
    }
}

class UserEvent{
    user_id;
    team_user_id;
    organization_id;
    workspace_id;
    action;
    description;
    timestamp;
    meta = {};

    constructor(user, orgTeamUser, _action){
        this.user_id = user._id.toString();
        this.organization_id = user.organization.toString();
        this.team_user_id = orgTeamUser._id.toString();
        this.action = _action;
        this.timestamp = new Date().toISOString();
    }
}

class UserEventService{

    // workspace
    static async userCreatedWorkspace(user, orgTeamUser, workspace){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_create');
        _event.description = `${user.firstname} created workspace ${workspace.name.toUpperCase()}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userAddedMemberToWorkspace(user, orgTeamUser, workspace, teamMember, teamMemberUser, workspace_member){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_add_user');
        _event.description = `${user.firstname} added ${teamMemberUser.firstname} to workspace ${workspace.name.toUpperCase()}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userRemovedMemberFromWorkspace(user, orgTeamUser, workspace, teamMember, teamMemberUser, workspace_member){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_remove_user');
        _event.description = `${user.firstname} removed ${teamMemberUser.firstname} from workspace ${workspace.name.toUpperCase()}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userLeftWorkspace(user, orgTeamUser, workspace){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_leave');
        _event.description = `${user.firstname} has left workspace ${workspace.name.toUpperCase()}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userModifiedWorkspaceMeta(user, orgTeamUser, workspace){
        // name, description
        const _event = new UserEvent(user, orgTeamUser, 'workspace_edit');
        _event.description = `${user.firstname} updated workspace ${workspace.name.toUpperCase()}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userDeletedWorkspace(user, orgTeamUser, workspace){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_delete');
        _event.description = `${user.firstname} deleted workspace ${workspace.name.toUpperCase()}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    // functions
    static async userCreatedFunction(user, orgTeamUser, workspace, wfunction){
        const _event = new UserEvent(user, orgTeamUser, 'function_create');
        _event.description = `${user.firstname} created function ${wfunction.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userUpdatedFunction(user, orgTeamUser, workspace, wfunction){
        const _event = new UserEvent(user, orgTeamUser, 'function_edit');
        _event.description = `${user.firstname} changed function ${wfunction.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userDeletedFunction(user, orgTeamUser, workspace, wfunction){
        const _event = new UserEvent(user, orgTeamUser, 'function_delete');
        _event.description = `${user.firstname} deleted function ${wfunction.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    // variables
    static async userCreatedVariable(user, orgTeamUser, workspace, variableName, value){
        const _event = new UserEvent(user, orgTeamUser, 'variable_create');
        _event.description = `${user.firstname} added variable ${variableName} with value ${value}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userUpdatedVariable(user, orgTeamUser, workspace, variableName, newvalue){
        // value, name, description
        const _event = new UserEvent(user, orgTeamUser, 'variable_edit');
        _event.description = `${user.firstname} updated variable ${variableName} with new value ${newvalue}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userDeletedVariable(user, orgTeamUser, workspace, variableName){
        const _event = new UserEvent(user, orgTeamUser, 'variable_delete');
        _event.description = `${user.firstname} deleted variable ${variableName}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    // Polling Jobs
    static async userCreatedPollingJob(user, orgTeamUser, workspace, pollingJob){
        const _event = new UserEvent(user, orgTeamUser, 'pollingjob_create');
        _event.description = `${user.firstname} added new Polling Job - ${pollingJob.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userUpdatedPollingJob(user, orgTeamUser, workspace, pollingJob){
        const _event = new UserEvent(user, orgTeamUser, 'pollingjob_edit');
        _event.description = `${user.firstname} updated Polling Job - ${pollingJob.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userDeletedPollingJob(user, orgTeamUser, workspace, pollingJob){
        const _event = new UserEvent(user, orgTeamUser, 'pollingjob_delete');
        _event.description = `${user.firstname} deleted Polling Job - ${pollingJob.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    // channels
    static async userCreatedChannel(user, orgTeamUser, workspace, channel){
        const _event = new UserEvent(user, orgTeamUser, 'channel_create');
        _event.description = `${user.firstname} added new Channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userUpdatedChannelMeta(user, orgTeamUser, workspace, channel, newChannelData){
        // name, description
        const _event = new UserEvent(user, orgTeamUser, 'channel_edit');
        _event.description = `${user.firstname} updated Channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userDeletedChannel(user, orgTeamUser, workspace, channel){
        const _event = new UserEvent(user, orgTeamUser, 'channel_delete');
        _event.description = `${user.firstname} deleted Channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    // rules
    static async userAddedRuleToChannel(user, orgTeamUser, workspace, channel, rule){
        const _event = new UserEvent(user, orgTeamUser, 'rule_create');
        _event.description = `${user.firstname} added new Rule - "${rule.name}" in Channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userupdatedRuleIndex(user, orgTeamUser, workspace, channel, rule, newIndex){
        const _event = new UserEvent(user, orgTeamUser, 'rule_index_edit');
        _event.description = `${user.firstname} changed Rule Index for Rule - "${rule.name}" to ${newIndex} in Channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userDeletedRuleFromChannel(user, orgTeamUser, workspace, channel, rule){
        const _event = new UserEvent(user, orgTeamUser, 'rule_delete');
        _event.description = `${user.firstname} removed Rule - "${rule.name}" from Channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async userModifiedRuleInChannel(user, orgTeamUser, workspace, channel, rule){
        const _event = new UserEvent(user, orgTeamUser, 'rule_edit');
        _event.description = `${user.firstname} updated Rule - "${rule.name}" in Channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    // workspace admin
    static async workspaceLocked(user, orgTeamUser, workspace){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_locked');
        _event.description = `${user.firstname} locked workspace - ${workspace.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async workspaceUnlocked(user, orgTeamUser, workspace){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_unlocked');
        _event.description = `${user.firstname} unlocked workspace - ${workspace.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async workspaceMemberGivenAdmin(user, orgTeamUser, workspace, teamMember, teamMemberUser, workspace_member){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_admin_granted');
        _event.description = `${user.firstname} made ${teamMemberUser.firstname} workspace admin`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async workspaceMemberAdminRevoked(user, orgTeamUser, workspace, teamMember, teamMemberUser, workspace_member){
        const _event = new UserEvent(user, orgTeamUser, 'workspace_admin_revoked');
        _event.description = `${user.firstname} revoked workspace admin priviledge from ${teamMemberUser.firstname}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async channelLocked(user, orgTeamUser, workspace, channel){
        const _event = new UserEvent(user, orgTeamUser, 'channel_locked');
        _event.description = `${user.firstname} locked channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async channelUnlocked(user, orgTeamUser, workspace, channel){
        const _event = new UserEvent(user, orgTeamUser, 'channel_unlocked');
        _event.description = `${user.firstname} unlocked channel - ${channel.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async functionLocked(user, orgTeamUser, workspace, wfunction){
        const _event = new UserEvent(user, orgTeamUser, 'function_locked');
        _event.description = `${user.firstname} locked function - ${wfunction.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async functionUnlocked(user, orgTeamUser, workspace, wfunction){
        const _event = new UserEvent(user, orgTeamUser, 'function_unlocked');
        _event.description = `${user.firstname} unlocked function - ${wfunction.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async variableLocked(user, orgTeamUser, workspace, variable){
        const _event = new UserEvent(user, orgTeamUser, 'variable_locked');
        _event.description = `${user.firstname} locked variable - ${variable.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async variableUnlocked(user, orgTeamUser, workspace, variable){
        const _event = new UserEvent(user, orgTeamUser, 'variable_unlocked');
        _event.description = `${user.firstname} unlocked variable - ${variable.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async pollingJobLocked(user, orgTeamUser, workspace, pollingJob){
        const _event = new UserEvent(user, orgTeamUser, 'pollingjob_locked');
        _event.description = `${user.firstname} locked polling job - ${pollingJob.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async pollingJobUnlocked(user, orgTeamUser, workspace, pollingJob){
        const _event = new UserEvent(user, orgTeamUser, 'pollingjob_unlocked');
        _event.description = `${user.firstname} unlocked polling job - ${pollingJob.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async ruleLocked(user, orgTeamUser, workspace, rule){
        const _event = new UserEvent(user, orgTeamUser, 'rule_locked');
        _event.description = `${user.firstname} locked Rule - ${rule.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    static async ruleUnlocked(user, orgTeamUser, workspace, rule){
        const _event = new UserEvent(user, orgTeamUser, 'rule_unlocked');
        _event.description = `${user.firstname} unlocked Rule - ${rule.name}`;
        _event.workspace_id = workspace._id.toString();
        await send(_event);
    }

    // organization
    static async userAddedMemberToOrganization(user, orgTeamUser, teamMember, teamMemberUser){
        const _event = new UserEvent(user, orgTeamUser, 'team_add');
        _event.description = `${user.firstname}`;
        await send(_event);
    }

    static async userRemovedMemberFromOrganization(user, orgTeamUser, teamMember, teamMemberUser){
        const _event = new UserEvent(user, orgTeamUser, 'team_remove');
        _event.description = `${user.firstname}`;
        await send(_event);
    }

    static async TeamMemberHasJoinedOrganization(organization, teamMember, teamMemberUser){
        const _event = new UserEvent(teamMemberUser, teamMember, 'team_join');
        _event.description = `${user.firstname}`;
        await send(_event);
    }

    static async TeamMemberHasLeftOrganization(organization, teamMember, teamMemberUser){
        const _event = new UserEvent(teamMemberUser, teamMember, 'team_leave');
        _event.description = `${user.firstname}`;
        await send(_event);
    }
}

module.exports = UserEventService;