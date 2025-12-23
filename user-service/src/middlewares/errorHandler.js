const logger = require('../utils/logger');

/**
 * Enhanced error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.clientIp || req.ip,
    userId: req.user?.userId || 'anonymous'
  });

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(error => error.message)
      .join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
};

module.exports = { errorHandler, notFound };
