const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const updateRuleValidation = {
    body: Joi.object({
      workspaceId: Joi.objectId(),
      channelId: Joi.objectId(),
      ruleId: Joi.objectId(),
      rule: Joi.string().optional(),
      index: Joi.number().optional(),
      title: Joi.string().optional(),
      description: Joi.string().optional()
    }),
  };

const middleware = validate(updateRuleValidation);
module.exports = middleware;