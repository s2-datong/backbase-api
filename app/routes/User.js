const authenticatedMiddleware = require('../middlewares/authenticated');
const billingMiddleware = require('../middlewares/billing');
const userValidators = require('../input-validators/User');
const genericQueryValidator = require('../input-validators/Generic-Query');
const paramObjectIdValidator = require('../input-validators/ParamObjectId');
const UserController = require('../controllers/User');

const Router = require('express').Router;
const router = Router();

router.get('/', authenticatedMiddleware, async (req, res) => {
    const resp = await UserController.profile(req.user, req.orgTeamUser);
    return res.json(resp);
});

router.put('/profile',
[authenticatedMiddleware, userValidators.updateProfileValidator],
async (req, res) => {
    const resp = await UserController.updateProfile(
        req.user, req.orgTeamUser, req.body.firstname || null,
        req.body.lastname || null, req.body.current_password || null,
        req.body.new_password || null, req.files
    );
    return res.json(resp);
});

router.get('/token/refresh', authenticatedMiddleware, async (req, res) => {
    const resp = await UserController.refreshToken(req.user, req.orgTeamUser);
    return res.json(resp);
});

exports.Router = router;