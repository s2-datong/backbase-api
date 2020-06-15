const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const createFunctionValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      functionDefinition: Joi.string().required(),
      description: Joi.string().required()
    })
  };

const middleware = validate(createFunctionValidation);
module.exports = middleware;