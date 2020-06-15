const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const updateChannelValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      channelId: Joi.objectId(),
      name: Joi.string().required(),
      description: Joi.string().required()
    })
  };

const middleware = validate(updateChannelValidation);
module.exports = middleware;