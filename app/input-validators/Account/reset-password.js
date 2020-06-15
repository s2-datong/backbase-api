const { validate, Joi } = require('express-validation')

const resetPasswordValidation = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .required(),
        passwordToken: Joi.string()
            .required(),
        newPassword: Joi.string()
            .required()
    }),
  };

const middleware = validate(resetPasswordValidation);
module.exports = middleware;