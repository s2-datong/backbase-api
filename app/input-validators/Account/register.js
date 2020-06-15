const { validate, Joi } = require('express-validation')

const registerValidation = {
    body: Joi.object({
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        email: Joi.string()
            .email()
            .required(),
        password: Joi.string()
            .required()
    }),
  };

const middleware = validate(registerValidation);
module.exports = middleware;