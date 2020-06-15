const { validate, Joi } = require('express-validation');

const user = Joi.string().email().required();
const users = Joi.array().min(1).items(user);

const middleware = validate({body: users});
module.exports = middleware;