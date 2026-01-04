const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Internal server error";

    if (res.headersSent) {
        return next(err);
    }

    const responseBody = { error: message };

    if (process.env.NODE_ENV !== "production" && err.stack) {
        responseBody.stack = err.stack;
    }

    console.error("Notification service error:", message);
    res.status(statusCode).json(responseBody);
};

module.exports = errorMiddleware;
