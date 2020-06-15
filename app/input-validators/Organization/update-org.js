const { validate, Joi } = require('express-validation')

const updateOrgValidation = {
    body: Joi.object({
      companyname: Joi.string().optional()
    })
  };

const middleware = validate(updateOrgValidation);
module.exports = middleware;