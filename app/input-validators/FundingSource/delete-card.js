const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const cardIdValidation = {
    params: Joi.object({
        cardId: Joi.objectId()
    })
  };

const middleware = validate(cardIdValidation);
module.exports = middleware;