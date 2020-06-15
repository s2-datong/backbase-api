const authenticatedMiddleware = require('../middlewares/authenticated');
const billingMiddleware = require('../middlewares/billing');
const functionValidators = require('../input-validators/Functions');
const FunctionsController = require('../controllers/Functions');

const Router = require('express').Router;
const router = Router();

// create function
router.post('/', 
[authenticatedMiddleware, functionValidators.createFunctionValidator, billingMiddleware('add_function')],
async (req, res) => {
    const resp = await FunctionsController.createFunction(
        req.user, req.orgTeamUser, req.body.functionDefinition,
        req.body.description, req.body.workspaceId
    );
    return res.json(resp);
});

// update functions
router.put('/', 
[authenticatedMiddleware, functionValidators.updateFunctionValidator],
async (req, res) => {
    const resp = await FunctionsController.updateFunction(
        req.user, req.orgTeamUser, req.body.functionId,
        req.body.functionDefinition, req.body.description,
        req.body.workspaceId
    );
    return res.json(resp);
});

router.get('/:workspaceId',
[authenticatedMiddleware, functionValidators.listFunctionValidator],
async (req, res) => {
    const resp = await FunctionsController.listFunctions(
        req.user, req.orgTeamUser, req.params.workspaceId,
        req.query.page, req.query.limit, req.query.searchTerm || null
    );
    return res.json(resp);
});

router.delete('/:workspaceId',
[authenticatedMiddleware, functionValidators.deleteFunctionValidator],
async (req, res) => {
    const resp = await FunctionsController.deleteFunction(
        req.user, req.orgTeamUser, req.body.functionName,
        req.params.workspaceId
    );
    return res.json(resp);
});

exports.Router = router;