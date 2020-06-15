const { validate, Joi } = require('express-validation')

const createWorkspaceValidation = {
    body: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required()
    }),
  };

const middleware = validate(createWorkspaceValidation);
module.exports = middleware;