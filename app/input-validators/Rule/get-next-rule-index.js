const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const getNextRuleIndexValidation = {
    params: Joi.object({
      workspaceId: Joi.objectId(),
      channelId: Joi.objectId()
    })
  };

const middleware = validate(getNextRuleIndexValidation);
module.exports = middleware;