const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const config = require('../config/env');

/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  let error = err;

  // Normalize known error types into ApiError so the response shape stays consistent
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    const details = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details);
  } else if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid value for ${err.path}`, 'INVALID_ID');
  } else if (err.code === 11000) {
    // Mongo duplicate key
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`${field} already exists`, 'DUPLICATE_KEY');
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Invalid or expired token', 'INVALID_TOKEN');
  } else if (!(err instanceof ApiError)) {
    // Unexpected/programming error — don't leak internals to the client
    logger.error(err.stack || err.message);
    error = ApiError.internal();
  }

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${error.message}`, { stack: err.stack });
  } else if (!config.isProduction) {
    logger.debug(`${req.method} ${req.originalUrl} -> ${error.statusCode} ${error.code}: ${error.message}`);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'ERROR',
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

module.exports = { errorHandler, notFoundHandler };
