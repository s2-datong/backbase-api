const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const createVariableValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      name: Joi.string().required(),
      value: Joi.any().required(),
      description: Joi.string().required()
    })
  };

const middleware = validate(createVariableValidation);
module.exports = middleware;