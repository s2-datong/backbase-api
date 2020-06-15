const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const listChannelsValidation = {
    params: Joi.object({
        workspaceId: Joi.objectId()
    }),
    query: Joi.object({
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(20)
    })
  };

const middleware = validate(listChannelsValidation);
module.exports = middleware;