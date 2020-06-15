const { validate, Joi } = require('express-validation');
const objectId = require('joi-objectid')(Joi);
Joi.objectId = objectId;

module.exports = paramKey => {
    const obj = {};
    obj[paramKey] = Joi.objectId();

    const genericParamValidator = {
        params: Joi.object(obj)
    };

    const middleware = validate(genericParamValidator);
    return middleware;
};