const { validate, Joi } = require('express-validation')

const inviteUser = {
    body: Joi.object({
      email: Joi.string().email().required()
    }),
  };

const middleware = validate(inviteUser);
module.exports = middleware;