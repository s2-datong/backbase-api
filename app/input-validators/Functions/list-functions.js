const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const listFunctionsValidation = {
    params: Joi.object({
        workspaceId: Joi.objectId()
    }),
    query: Joi.object({
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(20),
      searchTerm: Joi.string().optional()
    })
  };

const middleware = validate(listFunctionsValidation);
module.exports = middleware;