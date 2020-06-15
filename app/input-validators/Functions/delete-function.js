const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const deleteFunctionValidation = {
    params: Joi.object({
        workspaceId: Joi.objectId()
    }),
    body: Joi.object({
        functionName: Joi.string().required()
    })
  };

const middleware = validate(deleteFunctionValidation);
module.exports = middleware;