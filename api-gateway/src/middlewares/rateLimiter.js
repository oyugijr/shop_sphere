// Simple in-memory rate limiter
const requestCounts = new Map();

const rateLimiter = (windowMs = 60000, maxRequests = 100) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    if (requestCounts.size > 10000) {
      requestCounts.clear();
    }

    // Get or create request log for this IP
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, []);
    }

    const requests = requestCounts.get(ip);
    
    // Filter out requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.'
      });
    }

    // Add current request
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);

    next();
  };
};

module.exports = rateLimiter;
