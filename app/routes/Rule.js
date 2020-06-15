const authenticatedMiddleware = require('../middlewares/authenticated');
const billingMiddleware = require('../middlewares/billing');
const RuleValidators = require('../input-validators/Rule');
const genericQueryValidator = require('../input-validators/Generic-Query');
const paramObjectIdValidator = require('../input-validators/ParamObjectId');
const RuleController = require('../controllers/Rule');

const Router = require('express').Router;
const router = Router();

// Create rule
router.post('/', 
    [authenticatedMiddleware, RuleValidators.createRuleValidator, billingMiddleware('add_rule')],
async (req, res) => {
    const resp = await RuleController.createRule(
        req.user, req.orgTeamUser, req.body.workspaceId,
        req.body.channelId, req.body.rule, req.body.index,
        req.body.title, req.body.description
    );
    return res.json(resp);
});

// list rules
router.get('/:workspaceId/:channelId', 
    [authenticatedMiddleware, RuleValidators.listRulesValidator],
async (req, res) => {
    const resp = await RuleController.listRules(
        req.user, req.orgTeamUser, req.params.workspaceId, req.params.channelId
    );
    res.json(resp);
});

// update rule
router.put('/', 
    [authenticatedMiddleware, RuleValidators.updateRuleValidator],
async (req, res) => {
    const resp = await RuleController.updateRule(
        req.user, req.orgTeamUser, req.body.workspaceId, req.body.channelId,
        req.body.ruleId,
        req.body.rule || null, req.body.index || null,
        req.body.title || null, req.body.description || null
    );
    return res.json(resp);
});

// delete rule
router.delete('/:workspaceId/:channelId/:ruleId', 
    [authenticatedMiddleware, RuleValidators.deleteRuleValidator], 
async (req, res) => {
    const resp = await RuleController.deleteRule(
        req.user, req.orgTeamUser, req.params.workspaceId,
        req.params.channelId, req.params.ruleId
    );
    return res.json(resp);
});

// get next rule index
router.get('/nextindex/:workspaceId/:channelId',
[authenticatedMiddleware, RuleValidators.nextRuleIndexValidator],
async (req, res) => {
    const resp = await RuleController.returnNextValidRuleIndex(
        req.user, req.orgTeamUser, req.params.workspaceId,
        req.params.channelId
    );
    return res.json(resp);
});

// is rule index valid
router.get('/:workspaceId/:channelId/:index',
[authenticatedMiddleware, RuleValidators.ruleIndexValidValidator],
async (req, res) => {
    const resp = await RuleController.isRuleIndexValid(
        req.user, req.orgTeamUser, req.params.workspaceId,
        req.params.channelId, req.params.index
    );
    return res.json(resp);
});

exports.Router = router;