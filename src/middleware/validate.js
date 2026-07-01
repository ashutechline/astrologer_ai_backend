const ApiError = require('../utils/ApiError');

/**
 * Usage: router.post('/path', validate(schema), controller)
 * schema: { body?: Joi.object, query?: Joi.object, params?: Joi.object }
 */
function validate(schema) {
  const middleware = (req, res, next) => {
    for (const key of ['body', 'query', 'params']) {
      if (!schema[key]) continue;
      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        const details = error.details.map((d) => d.message);
        return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
      }
      req[key] = value;
    }
    next();
  };

  // Expose schema for Swagger reflection
  middleware._schema = schema;
  return middleware;
}

module.exports = validate;
