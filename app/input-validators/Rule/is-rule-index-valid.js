const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const isRuleIndexValidValidation = {
    params: Joi.object({
      workspaceId: Joi.objectId(),
      channelId: Joi.objectId(),
      index: Joi.number().required()
    })
  };

const middleware = validate(isRuleIndexValidValidation);
module.exports = middleware;