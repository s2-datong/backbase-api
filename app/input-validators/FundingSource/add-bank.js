const { validate, Joi } = require('express-validation')

const addBankValidation = {
    body: Joi.object({
      token: Joi.string().required(),
      account_id: Joi.string().required()
    })
  };

const middleware = validate(addBankValidation);
module.exports = middleware;