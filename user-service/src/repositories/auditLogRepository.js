const AuditLog = require('../models/AuditLogs');
const logger = require('../utils/logger');

const ensureLowercaseEmail = (email) => (typeof email === 'string' ? email.toLowerCase() : null);

const logEvent = async (eventData = {}) => {
    const payload = {
        userId: eventData.userId || null,
        email: ensureLowercaseEmail(eventData.email),
        action: eventData.action,
        ipAddress: eventData.ipAddress || 'unknown',
        userAgent: eventData.userAgent || null,
        metadata: eventData.metadata || {},
        success: typeof eventData.success === 'boolean' ? eventData.success : true,
        errorMessage: eventData.errorMessage || null,
    };

    if (!payload.email || !payload.action) {
        logger.warn('auditLogRepository.logEvent called without required fields', {
            hasEmail: Boolean(payload.email),
            action: payload.action,
        });
        return null;
    }

    try {
        return await AuditLog.log(payload);
    } catch (error) {
        logger.error('Failed to persist audit log', {
            error: error.message,
            action: payload.action,
            email: payload.email,
        });
        return null;
    }
};

const getUserLogs = async (userId, limit = 50) => {
    try {
        return await AuditLog.getUserLogs(userId, limit);
    } catch (error) {
        logger.error('Failed to fetch user audit logs', { error: error.message, userId });
        throw error;
    }
};

const getFailedLoginAttempts = async (email, since) => {
    try {
        return await AuditLog.getFailedLoginAttempts(ensureLowercaseEmail(email), since);
    } catch (error) {
        logger.error('Failed to fetch failed login attempts', { error: error.message, email });
        throw error;
    }
};

const getSuspiciousActivity = async (ipAddress, hours = 24) => {
    try {
        return await AuditLog.getSuspiciousActivity(ipAddress, hours);
    } catch (error) {
        logger.error('Failed to fetch suspicious activity', { error: error.message, ipAddress });
        throw error;
    }
};

module.exports = {
    logEvent,
    getUserLogs,
    getFailedLoginAttempts,
    getSuspiciousActivity,
};
