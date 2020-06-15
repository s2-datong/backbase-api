const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const createChannelValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      name: Joi.string().required(),
      description: Joi.string().required()
    })
  };

const middleware = validate(createChannelValidation);
module.exports = middleware;