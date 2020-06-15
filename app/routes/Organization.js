const authenticatedMiddleware = require('../middlewares/authenticated');
const billingMiddleware = require('../middlewares/billing');
const inputValidators = require('../input-validators/Organization');
const genericQueryValidator = require('../input-validators/Generic-Query');
const paramObjectIdValidator = require('../input-validators/ParamObjectId');
const OrganizationController = require('../controllers/Organization');
const Router = require('express').Router;
const router = Router();

// update company name and logo
router.put('/', [
    authenticatedMiddleware, 
    inputValidators.updateOrgMiddleware], async (req, res) => {
    const resp = await OrganizationController.updateCompanyDetails(
        req.user, req.orgTeamUser, req.body.companyname, req.files
    );
    return res.json(resp);
});

// invite single user
router.post('/invite/user', [
    authenticatedMiddleware, 
    inputValidators.inviteUserMiddleware], async (req, res) => {
    const resp = await OrganizationController.inviteTeamMember(
        req.user, req.orgTeamUser, req.body.email
    );
    return res.json(resp);
});

// invite maximum 10 users
router.post('/invite/users', [
    authenticatedMiddleware, 
    inputValidators.inviteUsersMiddleware], async (req, res) => {
    const resp = await OrganizationController.inviteTeamMembers(
        req.user, req.orgTeamUser, req.body
    );
    return res.json(resp);
});

// list team members
router.get('/team', [
    authenticatedMiddleware, genericQueryValidator], async (req, res) => {
    const resp = await OrganizationController.listTeamMembers(
        req.user, req.orgTeamUser, req.query.limit, req.query.page
    );
    return res.json(resp);
});

// delete team member
router.delete('/team/:memberId', [
    authenticatedMiddleware, 
    paramObjectIdValidator('memberId')], async (req, res) => {
    const resp = await OrganizationController.deleteTeamMember(
        req.user, req.orgTeamUser, req.params.memberId
    );
    return res.json(resp);
});

// make org team member admin
router.put('/team/admin/:memberId', [
    authenticatedMiddleware, 
    paramObjectIdValidator('memberId')], async (req, res) => {
    const resp = await OrganizationController.makeTeamMemberAdmin(
        req.user, req.orgTeamUser, req.params.memberId
    );
    return res.json(resp);
});

// remove admin priviledge from org team member
router.delete('/team/admin/:memberId', [
    authenticatedMiddleware, 
    paramObjectIdValidator('memberId')], async (req, res) => {
    const resp = await OrganizationController.removeAdminPriviledgeFromMember(
        req.user, req.orgTeamUser, req.params.memberId
    );
    return res.json(resp);
});

router.get('/settings', authenticatedMiddleware, async (req, res) => {
    const resp = await OrganizationController.getSettings(req.user);
    res.json(resp);
});

router.post('/', authenticatedMiddleware, async (req, res) => {
    const resp = await OrganizationController.createNewOrganization(req.user, req.orgTeamUser);
    res.json(resp);
});

router.get('/', authenticatedMiddleware, async (req, res) => {
    const resp = await OrganizationController.ListOrganizations(req.user, req.orgTeamUser);
    res.json(resp);
});

router.get('/switch/:org_id', 
    [authenticatedMiddleware, paramObjectIdValidator('org_id')],
    async (req, res) => {
        const resp = await OrganizationController.switchOrganization(req.user, req.orgTeamUser, req.params.org_id);
        res.json(resp);
    });

router.post('/transfer/:memberId',  [
    authenticatedMiddleware, 
    paramObjectIdValidator('memberId')], async (req, res) => {
        const resp = await OrganizationController.TransferOrganization(
            req.user, req.orgTeamUser, req.params.memberId
        );
        res.json(resp);
});

router.post('/apikeys/refresh', authenticatedMiddleware, async (req, res) => {
    const resp = await OrganizationController.RefreshAPIKey(req.user, req.orgTeamUser);
    res.json(resp);
});

exports.Router = router;