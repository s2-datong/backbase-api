const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const cardDefaultValidation = {
    params: Joi.object({
        cardId: Joi.objectId()
    })
  };

const middleware = validate(cardDefaultValidation);
module.exports = middleware;