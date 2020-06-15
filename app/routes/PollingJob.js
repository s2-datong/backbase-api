const authenticatedMiddleware = require('../middlewares/authenticated');
const billingMiddleware = require('../middlewares/billing');
const pollingJobValidators = require('../input-validators/PollingJob');
const PollingJobController = require('../controllers/PollingJob');

const Router = require('express').Router;
const router = Router();

// create polling job
router.post('/', 
[   authenticatedMiddleware, 
    pollingJobValidators.createPollingJobValidator,
    billingMiddleware('add_polling_job')
],
async (req, res) => {
    const resp = await PollingJobController.createPollingJob(
        req.user, req.orgTeamUser, req.body.workspaceId,
        req.body.name, req.body.description, req.body.getWebhook,
        req.body.postWebhook, req.body.hashSecret, req.body.channelId,
        req.body.interval, req.body.queue
    );
    return res.json(resp);
});

// list polling Jobs
router.get('/:workspaceId', 
[   authenticatedMiddleware,
    pollingJobValidators.listPollingJobsValidator
],
async (req, res) => {
    const resp = await PollingJobController.listPollingJobs(
        req.user, req.orgTeamUser, req.params.workspaceId,
        req.query.page, req.query.limit, req.query.searchTerm || null
    );
    return res,json(resp);
});

// update Polling Job
router.put('/', 
[   authenticatedMiddleware, 
    pollingJobValidators.updatePollingJobValidator,
],
async (req, res) => {
    const resp = await PollingJobController.updatePollingJob(
        req.user, req.orgTeamUser, req.body.workspaceId,
        req.body.pollingJobId,
        req.body.name || null, req.body.description || null, 
        req.body.getWebhook || null,
        req.body.postWebhook || null, 
        req.body.hashSecret || null, req.body.channelId || null,
        req.body.interval || null, req.body.queue || null
    );
    return res.json(resp);
});

// delete polling job
router.delete('/:workspaceId/:pollingJobId', 
    [authenticatedMiddleware, pollingJobValidators.deletePollingJobValidator],
async (req, res) => {
    const resp = await PollingJobController.deletePollingJob(
        req.user, req.orgTeamUser, req.params.workspaceId, req.params.pollingJobId
    );

    return res.json(resp);
});

exports.Router = router;
