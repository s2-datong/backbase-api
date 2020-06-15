const { validate, Joi } = require('express-validation');
Joi.ObjectId = require('joi-objectid')(Joi);

const addUserToWorkspace = {
    body: Joi.object({
      workspaceId: Joi.ObjectId(),
      userId: Joi.ObjectId()
    }),
  };

const middleware = validate(addUserToWorkspace);
module.exports = middleware;