/**
 * Custom error classes and error handling utilities
 */

/**
 * Base API Error class
 */
class APIError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error (400)
 */
class ValidationError extends APIError {
    constructor(message, errors = []) {
        super(message, 400);
        this.errors = errors;
    }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends APIError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

/**
 * Unauthorized Error (401)
 */
class UnauthorizedError extends APIError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}

/**
 * Forbidden Error (403)
 */
class ForbiddenError extends APIError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

/**
 * Conflict Error (409)
 */
class ConflictError extends APIError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

/**
 * Internal Server Error (500)
 */
class InternalServerError extends APIError {
    constructor(message = 'Internal server error') {
        super(message, 500, false);
    }
}

/**
 * Handle MongoDB errors
 */
const handleMongoError = (error) => {
    // Duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return new ConflictError(`A product with this ${field} already exists`);
    }

    // Validation error
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return new ValidationError('Validation failed', errors);
    }

    // Cast error (invalid ObjectId)
    if (error.name === 'CastError') {
        return new ValidationError(`Invalid ${error.path}: ${error.value}`);
    }

    return null;
};

/**
 * Format error response
 */
const formatErrorResponse = (error, includeStack = false) => {
    const response = {
        error: error.message || 'An error occurred',
        timestamp: error.timestamp || new Date().toISOString(),
        statusCode: error.statusCode || 500
    };

    // Include validation errors if present
    if (error.errors && Array.isArray(error.errors)) {
        response.errors = error.errors;
    }

    // Include stack trace in development
    if (includeStack && error.stack) {
        response.stack = error.stack;
    }

    return response;
};

/**
 * Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    const logger = require('./logger');

    // Handle MongoDB errors
    const mongoError = handleMongoError(err);
    if (mongoError) {
        err = mongoError;
    }

    // Log error
    logger.error(err.message, {
        statusCode: err.statusCode || 500,
        path: req.path,
        method: req.method,
        stack: err.stack,
        isOperational: err.isOperational
    });

    // Determine if we should include stack trace
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Send error response
    const statusCode = err.statusCode || 500;
    const errorResponse = formatErrorResponse(err, isDevelopment);

    res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    APIError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    InternalServerError,
    handleMongoError,
    formatErrorResponse,
    errorHandler,
    asyncHandler
};