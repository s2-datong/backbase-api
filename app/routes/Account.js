const AccountController = require('../controllers/Account');
const AccountMiddleware = require('../input-validators/Account');

const Router = require('express').Router;

const router = Router();
// Register
router.post('/users', AccountMiddleware.registerMiddleware, async (req, res) => {
    const resp = await AccountController.register(req.body.firstname, req.body.lastname, req.body.email, req.body.password);
    res.json(resp);
});

// login
router.post('/user', AccountMiddleware.loginMiddleware, async (req, res) => {
    const resp = await AccountController.login(req.body.email, req.body.password);
    res.json(resp);
});

// verify email
router.post('/email/verify', AccountMiddleware.verifyEmailMiddleware, async (req, res) => {
    const resp = await AccountController.verifyEmail(req.body.email, req.body.token);
    res.json(resp);
});

// resend verify Email
router.post('/email/resend', AccountMiddleware.justEmailMiddleware, async (req, res) => {
    const resp = await AccountController.resendVerifyEmailLink(req.body.email);
    res.json(resp);
});

// forgot password
router.post('/password/forgot', AccountMiddleware.justEmailMiddleware, async (req, res) => {
    const resp = await AccountController.forgotPassword(req.body.email);
    res.json(resp);
});

// reset password
router.post('/password/reset', AccountMiddleware.resetPasswordMiddleware, async (req, res) => {
    const resp = await AccountController.resetPassword(req.body.email, req.body.passwordToken, req.body.newPassword);
    res.json(resp);
});

// accept org invitation
router.post('/invitation/accept', AccountMiddleware.acceptOrgInviteMiddleware, async (req, res) => {
    const resp = await AccountController.createAccountFromInvitation(req.body.invitationToken, 
        req.body.firstName, req.body.lastName, req.body.password, req.body.retypePassword);
    res.json(resp);
});

router.get('/invitation/get/:token', async (req, res) => {
    const resp = await AccountController.verifyInvitationToken(req.params.token);
    res.json(resp);
});

exports.Router = router;
exports.documentation = {};
// so I can generate postman doc