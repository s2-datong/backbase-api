const loginMiddleware = require('./login');
const registerMiddleware = require('./register');

exports.loginMiddleware = loginMiddleware;
exports.registerMiddleware = registerMiddleware;
exports.verifyEmailMiddleware = require('./verify-email');
exports.justEmailMiddleware = require('./Just-Email');
exports.resetPasswordMiddleware = require('./reset-password');
exports.acceptOrgInviteMiddleware = require('./accept-org-invitation');