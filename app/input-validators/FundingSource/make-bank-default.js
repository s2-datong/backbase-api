const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const bankDefaultValidation = {
    params: Joi.object({
        bankId: Joi.objectId()
    })
  };

const middleware = validate(bankDefaultValidation);
module.exports = middleware;