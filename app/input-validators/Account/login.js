const { validate, Joi } = require('express-validation')

const loginValidation = {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
    }),
  };

const middleware = validate(loginValidation);
module.exports = middleware;