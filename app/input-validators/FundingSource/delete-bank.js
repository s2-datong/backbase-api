const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const bankIdValidation = {
    params: Joi.object({
        bankId: Joi.objectId()
    })
  };

const middleware = validate(bankIdValidation);
module.exports = middleware;