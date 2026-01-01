/**
 * Rate limiting middleware for product service
 * Tracks requests per user/IP per time window
 */
const requestCounts = new Map();

/**
 * Rate limiter factory
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests allowed in the window
 * @returns {Function} Express middleware
 */
const rateLimiter = (windowMs = 60000, maxRequests = 100) => {
    return (req, res, next) => {
        // Use user ID if authenticated, otherwise use IP address
        const identifier = req.user?.id?.toString() || req.ip || req.connection.remoteAddress;

        if (!identifier) {
            // If we can't identify the requester, allow the request
            return next();
        }

        const now = Date.now();

        // Get or initialize request history for this identifier
        if (!requestCounts.has(identifier)) {
            requestCounts.set(identifier, []);
        }

        const userRequests = requestCounts.get(identifier);

        // Remove old requests outside the time window
        const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

        // Check if identifier has exceeded the limit
        if (validRequests.length >= maxRequests) {
            const retryAfter = Math.ceil(windowMs / 1000);
            res.set('Retry-After', retryAfter);
            res.set('X-RateLimit-Limit', maxRequests);
            res.set('X-RateLimit-Remaining', 0);
            res.set('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

            return res.status(429).json({
                error: 'Too many requests. Please try again later.',
                retryAfter: retryAfter,
                message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`
            });
        }

        // Add current request timestamp
        validRequests.push(now);
        requestCounts.set(identifier, validRequests);

        // Set rate limit headers
        res.set('X-RateLimit-Limit', maxRequests);
        res.set('X-RateLimit-Remaining', maxRequests - validRequests.length);
        res.set('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

        // Cleanup old entries periodically to prevent memory leak
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

/**
 * Strict rate limiter for write operations (POST, PUT, DELETE)
 */
const strictRateLimiter = rateLimiter(60000, 30); // 30 requests per minute

/**
 * Lenient rate limiter for read operations (GET)
 */
const lenientRateLimiter = rateLimiter(60000, 100); // 100 requests per minute

module.exports = {
    rateLimiter,
    strictRateLimiter,
    lenientRateLimiter
};