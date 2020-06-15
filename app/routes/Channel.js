const authenticatedMiddleware = require('../middlewares/authenticated');
const billingMiddleware = require('../middlewares/billing');
const channelValidators = require('../input-validators/Channel');
const genericQueryValidator = require('../input-validators/Generic-Query');
const paramObjectIdValidator = require('../input-validators/ParamObjectId');
const ChannelController = require('../controllers/Channel');

const Router = require('express').Router;
const router = Router();

// create channel
router.post('/', 
[authenticatedMiddleware, channelValidators.createChannelValidator, billingMiddleware('add_channel')],
async (req, res) => {
    const resp = await ChannelController.createChannel(
        req.user, req.orgTeamUser, req.body.workspaceId, req.body.name,
        req.body.description
    );
    return res.json(resp);
});

// update Channel
router.put('/', 
[authenticatedMiddleware, channelValidators.updateChannelValidator],
async (req, res) => {
    const resp = await ChannelController.updateChannel(
        req.user, req.orgTeamUser, req.body.workspaceId,
        req.body.channelId, req.body.name, req.body.description
    );
    return res.json(resp);
});

router.get('/:workspaceId',
[authenticatedMiddleware, channelValidators.listChannelValidator],
async (req, res) => {
    const resp = await ChannelController.listChannels(
        req.user, req.orgTeamUser, req.params.workspaceId,
        req.query.page, req.query.limit
    );
    return res.json(resp);
});

router.delete('/:workspaceId/:channelId',
[authenticatedMiddleware, channelValidators.deleteChannelValidator],
async (req, res) => {
    const resp = await ChannelController.deleteChannel(
        req.user, req.orgTeamUser, req.params.workspaceId,
        req.params.channelId
    );
    return res.json(resp);
});

router.get('/describe/:channel_slug', async (req, res) => {
    let api_key = req.get('api-key');
    if(!api_key) api_key = req.get('authorization');
    if(!api_key) api_key = "";

    api_key = api_key.replace('Bearer', "");
    api_key = api_key.replace('bearer', "");
    api_key = api_key.trim();

    const resp = await ChannelController.describeChannel(api_key, req.params.channel_slug);
    return res.json(resp);
})

exports.Router = router;