const buildClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || null;
};

module.exports = (req, res, next) => {
    req.fraudContext = {
        ip: buildClientIp(req),
        userAgent: req.headers['user-agent'],
        acceptLanguage: req.headers['accept-language'],
        referer: req.headers.referer || req.headers.referrer,
        deviceId: req.headers['x-device-id'],
        sessionId: req.headers['x-session-id'],
        path: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
    };

    next();
};
