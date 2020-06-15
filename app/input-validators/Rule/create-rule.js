const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const createRuleValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      channelId: Joi.objectId(),
      rule: Joi.string().required(),
      index: Joi.number().required(),
      title: Joi.string().required(),
      description: Joi.string().required()
    }),
  };

const middleware = validate(createRuleValidation);
module.exports = middleware;