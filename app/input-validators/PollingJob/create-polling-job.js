const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const createPollingJobValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      name: Joi.string().required(),
      description: Joi.string().required(),
      getWebhook: Joi.string().uri(),
      postWebhook: Joi.string().uri(),
      hashSecret: Joi.string().required(),
      channelId: Joi.objectId(),
      interval: Joi.string().required(),
      queue: Joi.string().valid('stream','simple').required()
    })
  };

const middleware = validate(createPollingJobValidation);
module.exports = middleware;