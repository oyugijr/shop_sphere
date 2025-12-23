/**
 * Logging utility for the product service
 * Provides structured logging with different levels
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Format log message with timestamp and metadata
 */
const formatLog = (level, message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    service: 'product-service',
    ...metadata
  };
  
  if (isDevelopment) {
    // Pretty print in development
    return JSON.stringify(logEntry, null, 2);
  }
  
  // Compact format in production
  return JSON.stringify(logEntry);
};

/**
 * Log error messages
 */
const error = (message, metadata = {}) => {
  console.error(formatLog(LOG_LEVELS.ERROR, message, metadata));
};

/**
 * Log warning messages
 */
const warn = (message, metadata = {}) => {
  console.warn(formatLog(LOG_LEVELS.WARN, message, metadata));
};

/**
 * Log info messages
 */
const info = (message, metadata = {}) => {
  console.log(formatLog(LOG_LEVELS.INFO, message, metadata));
};

/**
 * Log debug messages (only in development)
 */
const debug = (message, metadata = {}) => {
  if (isDevelopment) {
    console.log(formatLog(LOG_LEVELS.DEBUG, message, metadata));
  }
};

/**
 * Log HTTP request
 */
const logRequest = (req) => {
  info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });
};

/**
 * Log HTTP response
 */
const logResponse = (req, res, duration) => {
  info('Outgoing response', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.id
  });
};

/**
 * Express middleware for logging requests and responses
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logRequest(req);
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logResponse(req, res, duration);
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  error,
  warn,
  info,
  debug,
  requestLogger,
  LOG_LEVELS
};
