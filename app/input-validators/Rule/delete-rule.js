const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const deleteRuleValidation = {
    params: Joi.object({
      workspaceId: Joi.objectId(),
      channelId: Joi.objectId(),
      ruleId: Joi.objectId()
    })
  };

const middleware = validate(deleteRuleValidation);
module.exports = middleware;