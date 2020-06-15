const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const listRuleValidation = {
    params: Joi.object({
      workspaceId: Joi.objectId(),
      channelId: Joi.objectId(),
    })
  };

const middleware = validate(listRuleValidation);
module.exports = middleware;