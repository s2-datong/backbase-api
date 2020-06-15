const authenticatedMiddleware = require('../middlewares/authenticated');
const billingMiddleware = require('../middlewares/billing');
const WorkspaceMiddlewares = require('../input-validators/Workspace');
const genericQueryValidator = require('../input-validators/Generic-Query');
const paramObjectIdValidator = require('../input-validators/ParamObjectId');
const WorkspaceController = require('../controllers/Workspace');

const Router = require('express').Router;
const router = Router();

// Create workspace
router.post('/', [authenticatedMiddleware,
    WorkspaceMiddlewares.createWorkspaceMiddleware,
    billingMiddleware('add_workspace')], async (req, res) => {
        const resp = await WorkspaceController.createWorkspace(req.user, req.orgTeamUser,
            req.body.name, req.body.description);
        return res.json(resp);
});

// add user to workspace
router.post('/users', [authenticatedMiddleware, WorkspaceMiddlewares.addUserToWorkspaceMiddleware], async (req, res) => {
    const resp = await WorkspaceController.addUserToWorkspace(
        req.user, req.orgTeamUser, req.body.workspaceId, req.body.userId
    );
    return res.json(resp);
});

// remove user form workspace
// same middleware for addusers to workspace
router.delete('/users', [authenticatedMiddleware, WorkspaceMiddlewares.addUserToWorkspaceMiddleware], async (req, res) => {
    const resp = await WorkspaceController.removeUserFromWorkspace(
        req.user, req.orgTeamUser, req.body.workspaceId, req.body.userId
    );
    return res.json(resp);
});

// change workspace owner
router.put('/owner', [authenticatedMiddleware, WorkspaceMiddlewares.addUserToWorkspaceMiddleware], async (req, res) => {
    const resp = await WorkspaceController.changeWorkspaceOwner(
        req.user, req.orgTeamUser, req.body.workspaceId, req.body.userId
    );
    return res.json(resp);
});

// list users in workspace
router.get('/users/:workspaceId', [authenticatedMiddleware, genericQueryValidator], async (req, res) => {
    const resp = await WorkspaceController.listUsersInWorkspace(req.user, req.orgTeamUser, req.params.workspaceId, req.query.page, req.query.limit);
    return res.json(resp);
});

// list workspaces in org
router.get('/', authenticatedMiddleware, async (req, res) => {
    const resp = await WorkspaceController.listWorkspaces(req.user, req.orgTeamUser);
    return res.json(resp);
});

// delete Workspace
router.delete('/:workspaceId', authenticatedMiddleware, async (req, res) => {
    const resp = await WorkspaceController.deleteWorkspace(req.user, req.orgTeamUser, req.params.workspaceId);
    return res.json(resp);
});

// list workspaces scheduled for deletion
router.get('/pending/delete', authenticatedMiddleware, async (req, res) => {
    const resp = await WorkspaceController.listPendingWorkspaceDeletions(req.user, req.orgTeamUser);
    return res.json(resp);
});

// cancel the pending deletion of a workspace
router.delete('/pending/delete/:workspaceId', authenticatedMiddleware, async (req, res) => {
    const resp = await WorkspaceController.cancelPendingWorkspaceDeletion(req.user, req.orgTeamUser, req.params.workspaceId);
    return res.json(resp);
});

// update workspace
router.put('/:workspaceId', 
    [authenticatedMiddleware, WorkspaceMiddlewares.createWorkspaceMiddleware], 
    async (req, res) => {
        const resp = await WorkspaceController.updateWorkspace(
            req.user, req.orgTeamUser, req.params.workspaceId, req.body.name, req.body.description
        );
        return res.json(resp);
});

// get my membership details of this workspace
router.get('/member/:workspaceId', authenticatedMiddleware, async (req, res) => {
    const resp = await WorkspaceController.getUsersWorkspaceMembership(
        req.user, req.orgTeamUser, req.params.workspaceId
    );
    return res.json(resp);
});

exports.Router = router;