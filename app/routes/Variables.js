const authenticatedMiddleware = require('../middlewares/authenticated');
const billingMiddleware = require('../middlewares/billing');
const variableValidators = require('../input-validators/Variables');
const VariablesController = require('../controllers/Variables');

const Router = require('express').Router;
const router = Router();

// create variable
router.post('/', 
[authenticatedMiddleware, variableValidators.createVariableValidator, billingMiddleware('add_variable')],
async (req, res) => {
    const resp = await VariablesController.createVariable(
        req.user, req.orgTeamUser, req.body.name,
        req.body.value, req.body.description, req.body.workspaceId
    );
    return res.json(resp);
});

// update variable
router.put('/', 
[authenticatedMiddleware, variableValidators.updateVariableValidator],
async (req, res) => {
    const resp = await VariablesController.updateVariableValue(
        req.user, req.orgTeamUser, req.body.name,
        req.body.value, req.body.description, req.body.workspaceId
    );
    return res.json(resp);
});

// list variables
router.get('/:workspaceId',
[authenticatedMiddleware, variableValidators.listVariableValidator],
async (req, res) => {
    const resp = await VariablesController.listVariables(
        req.user, req.orgTeamUser, req.params.workspaceId,
        req.query.page, req.query.limit, req.query.searchTerm || null
    );
    return res.json(resp);
});

router.delete('/:workspaceId/:channelId',
[authenticatedMiddleware, variableValidators.deleteVariableValidator],
async (req, res) => {
    const resp = await VariablesController.deleteVariable(
        req.user, req.orgTeamUser, req.body.name,
        req.params.workspaceId
    );
    return res.json(resp);
});

exports.Router = router;