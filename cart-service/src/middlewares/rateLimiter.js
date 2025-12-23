/**
 * Simple rate limiting middleware
 * Tracks requests per user per time window
 */
const requestCounts = new Map();

const rateLimiter = (windowMs = 60000, maxRequests = 100) => {
  return (req, res, next) => {
    const userId = req.user?.id;
    
    if (!userId) {
      // If no user (shouldn't happen after auth middleware), allow request
      return next();
    }

    const now = Date.now();
    const userKey = userId.toString();
    
    // Get or initialize user's request history
    if (!requestCounts.has(userKey)) {
      requestCounts.set(userKey, []);
    }
    
    const userRequests = requestCounts.get(userKey);
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    // Check if user has exceeded the limit
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }
    
    // Add current request timestamp
    validRequests.push(now);
    requestCounts.set(userKey, validRequests);
    
    // Cleanup old entries periodically
    if (requestCounts.size > 10000) {
      const cutoff = now - windowMs;
      for (const [key, timestamps] of requestCounts.entries()) {
        const valid = timestamps.filter(t => now - t < windowMs);
        if (valid.length === 0) {
          requestCounts.delete(key);
        } else {
          requestCounts.set(key, valid);
        }
      }
    }
    
    next();
  };
};

module.exports = rateLimiter;
