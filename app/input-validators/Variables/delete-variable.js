const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const deleteVariableValidation = {
    params: Joi.object({
        workspaceId: Joi.objectId()
    }),
    body: Joi.object({
        name: Joi.string().required()
    })
  };

const middleware = validate(deleteVariableValidation);
module.exports = middleware;