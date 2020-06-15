const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const updateFunctionValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      functionId: Joi.objectId(),
      functionDefinition: Joi.string().required(),
      description: Joi.string().required()
    })
  };

const middleware = validate(updateFunctionValidation);
module.exports = middleware;