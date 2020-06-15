const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const updateProfileValidation = {
    body: Joi.object({
        firstname: Joi.string().optional(),
        lastname: Joi.string().optional(),
        current_password: Joi.string().optional(),
        new_password: Joi.string().optional()
    })
  };

const middleware = validate(updateProfileValidation);
module.exports = middleware;