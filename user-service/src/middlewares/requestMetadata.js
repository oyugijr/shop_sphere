/**
 * Middleware to extract and attach client IP address and user agent to request
 */
const requestMetadata = (req, res, next) => {
  // Get IP address (handles proxies and load balancers)
  req.clientIp = 
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown';

  // Get user agent
  req.userAgent = req.headers['user-agent'] || 'unknown';

  next();
};

module.exports = requestMetadata;