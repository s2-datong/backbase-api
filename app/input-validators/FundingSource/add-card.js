const { validate, Joi } = require('express-validation')

const addCardValidation = {
    body: Joi.object({
      token: Joi.string().required()
    })
  };

const middleware = validate(addCardValidation);
module.exports = middleware;