const { validate, Joi } = require('express-validation')

const JustEmailValidation = {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
    })
  };

const middleware = validate(JustEmailValidation);
module.exports = middleware;