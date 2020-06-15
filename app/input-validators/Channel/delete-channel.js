const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const deleteChannelValidation = {
    params: Joi.object({
        workspaceId: Joi.objectId(),
        channelId: Joi.objectId()
    })
  };

const middleware = validate(deleteChannelValidation);
module.exports = middleware;