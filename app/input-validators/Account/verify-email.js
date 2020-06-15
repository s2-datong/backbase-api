const { validate, Joi } = require('express-validation')

const verifyEmailValidation = {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      token: Joi.string()
        .required()
    }),
  };

const middleware = validate(verifyEmailValidation);
module.exports = middleware;