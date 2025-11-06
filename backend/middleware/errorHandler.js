const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Unexpected error occurred.';

  logger.error('Unhandled error occurred.', {
    status,
    message,
    url: req.originalUrl,
    method: req.method,
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  return res.status(status).json({
    success: false,
    message,
    details: err.details,
  });
};

module.exports = errorHandler;
