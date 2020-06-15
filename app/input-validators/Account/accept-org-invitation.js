const { validate, Joi } = require('express-validation')

const acceptInviteValidation = {
    body: Joi.object({
        invitationToken: Joi.string()
            .required(),
        firstName: Joi.string()
            .required(),
        lastName: Joi.string()
            .required(),
        password: Joi.string()
            .required(),
        retypePassword: Joi.string()
            .required()
    }),
  };

const middleware = validate(acceptInviteValidation);
module.exports = middleware;