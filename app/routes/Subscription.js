const authenticatedMiddleware = require('../middlewares/authenticated');
const optionalAuthMiddleware = require('../middlewares/optional_authenticated');
const billingMiddleware = require('../middlewares/billing');
const SubscriptionController = require('../controllers/Subscription');

const Router = require('express').Router;
const router = Router();

router.get('/', authenticatedMiddleware, async (req, res) => {
    const resp = await SubscriptionController.getCurrentSubscriptionForOrg(
        req.user, req.orgTeamUser
    );
    return res.json(resp);
});

router.get('/plans', optionalAuthMiddleware, async (req, res) => {
    const resp = await SubscriptionController.getAvailableSubscriptionPlans(req.user);
    return res.json(resp);
});

router.put('/:subscriptionId', authenticatedMiddleware, async (req, res) => {
    const resp = await SubscriptionController.subscribeOrgToNewPlan(
        req.user, req.orgTeamUser, req.params.subscriptionId
    );
    return res.json(resp);
});

router.delete('/', authenticatedMiddleware, async (req, res) => {
    const resp = await SubscriptionController.cancelSubscription(
        req.user, req.orgTeamUser
    );
    return res.json(resp);
});

exports.Router = router;