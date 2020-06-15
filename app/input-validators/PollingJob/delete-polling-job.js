const { validate, Joi } = require('express-validation');
Joi.objectId = require('joi-objectid')(Joi);

const deletePollingJobValidation = {
    params: Joi.object({
        workspaceId: Joi.objectId(),
        pollingJobId: Joi.objectId()
    })
  };

const middleware = validate(deletePollingJobValidation);
module.exports = middleware;