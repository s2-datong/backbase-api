const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const updateVariableValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      name: Joi.string().required(),
      value: Joi.any().required(),
      description: Joi.string().required()
    })
  };

const middleware = validate(updateVariableValidation);
module.exports = middleware;