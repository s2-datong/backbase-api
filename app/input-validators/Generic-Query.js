const { validate, Joi } = require('express-validation')

const genericQuery = {
    query: Joi.object({
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(20)
    })
  };

const middleware = validate(genericQuery);
module.exports = middleware;