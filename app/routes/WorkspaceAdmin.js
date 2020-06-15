const authenticatedMiddleware = require('../middlewares/authenticated');
const paramObjectIdValidator = require('../input-validators/ParamObjectId');
const WorkspaceAdminController = require('../controllers/WorkspaceAdmin');

const Router = require('express').Router;
const router = Router();

router.put('/user/admin/add/:workspace_id/:team_user_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'), paramObjectIdValidator('team_user_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.makeUserWorkspaceAdmin(req.user, req.orgTeamUser, req.params.workspace_id, req.params.team_user_id);
    return res.json(resp);
});

router.put('/user/admin/remove/:workspace_id/:team_user_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'), paramObjectIdValidator('team_user_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.removeWorkspaceAdminPriviledge(req.user, req.orgTeamUser, req.params.workspace_id, req.params.team_user_id);
    return res.json(resp);
});

router.put('/workspace/lock/:workspace_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.LockWorkspace(req.user, req.orgTeamUser, req.params.workspace_id);
    return res.json(resp);
});

router.put('/workspace/unlock/:workspace_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.UnlockWorkspace(req.user, req.orgTeamUser, req.params.workspace_id);
    return res.json(resp);
});

router.put('/function/lock/:workspace_id/:function_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'), paramObjectIdValidator('function_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.LockFunction(req.user, req.orgTeamUser, req.params.workspace_id, req.params.function_id);
    return res.json(resp);
});

router.put('/function/unlock/:workspace_id/:function_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'),paramObjectIdValidator('function_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.UnlockFunction(req.user, req.orgTeamUser, req.params.workspace_id, req.params.function_id);
    return res.json(resp);
});

router.put('/variable/lock/:workspace_id/:variable_name', [authenticatedMiddleware, paramObjectIdValidator('workspace_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.LockVariable(req.user, req.orgTeamUser, req.params.workspace_id, req.params.variable_name);
    return res.json(resp);
});

router.put('/variable/unlock/:workspace_id/:variable_name', [authenticatedMiddleware, paramObjectIdValidator('workspace_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.UnlockVariable(req.user, req.orgTeamUser, req.params.workspace_id, req.params.variable_name);
    return res.json(resp);
});

// ---------

router.put('/pollingjob/lock/:workspace_id/:polling_job_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'), paramObjectIdValidator('polling_job_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.LockPollingJob(req.user, req.orgTeamUser, req.params.workspace_id, req.params.polling_job_id);
    return res.json(resp);
});

router.put('/pollingjob/unlock/:workspace_id/:polling_job_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'),paramObjectIdValidator('polling_job_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.UnlockPollingJob(req.user, req.orgTeamUser, req.params.workspace_id, req.params.polling_job_id);
    return res.json(resp);
});

router.put('/channel/lock/:workspace_id/:channel_id_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'), paramObjectIdValidator('channel_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.LockChannel(req.user, req.orgTeamUser, req.params.workspace_id, req.params.channel_id);
    return res.json(resp);
});

router.put('/channel/unlock/:workspace_id/:channel_id_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'),paramObjectIdValidator('channel_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.UnlockChannel(req.user, req.orgTeamUser, req.params.workspace_id, req.params.channel_id);
    return res.json(resp);
});

router.put('/rule/lock/:workspace_id/:rule_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'), paramObjectIdValidator('rule_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.LockRule(req.user, req.orgTeamUser, req.params.workspace_id, req.params.rule_id);
    return res.json(resp);
});

router.put('/rule/unlock/:workspace_id/:rule_id', [authenticatedMiddleware, paramObjectIdValidator('workspace_id'),paramObjectIdValidator('rule_id')], 
async (req, res) => {
    const resp = await WorkspaceAdminController.UnlockRule(req.user, req.orgTeamUser, req.params.workspace_id, req.params.rule_id);
    return res.json(resp);
});

exports.Router = router;