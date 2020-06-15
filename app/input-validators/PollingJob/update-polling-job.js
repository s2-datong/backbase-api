const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const updatePollingJobValidation = {
    body: Joi.object({
        pollingJobId: Joi.objectId(),
        workspaceId: Joi.objectId(),
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        getWebhook: Joi.string().uri().optional(),
        postWebhook: Joi.string().uri().optional(),
        hashSecret: Joi.string().required().optional(),
        channelId: Joi.string().optional(),
        interval: Joi.string().required(),
        queue: joi.string().valid('stream','simple').required()
    })
  };

const middleware = validate(updatePollingJobValidation);
module.exports = middleware;