const RefreshToken = require('../models/RefreshToken');

/**
 * Create a refresh token
 */
const createRefreshToken = async (userId, ipAddress, userAgent) => {
    return await RefreshToken.createRefreshToken(userId, ipAddress, userAgent);
};

/**
 * Verify and get refresh token
 */
const verifyRefreshToken = async (token) => {
    return await RefreshToken.verifyToken(token);
};

/**
 * Revoke a refresh token
 */
const revokeRefreshToken = async (token, replacedByToken = null) => {
    const refreshToken = await RefreshToken.findOne({ token });

    if (!refreshToken) {
        return null;
    }

    return await refreshToken.revoke(replacedByToken);
};

/**
 * Revoke all tokens for a user
 */
const revokeAllUserTokens = async (userId) => {
    return await RefreshToken.revokeAllUserTokens(userId);
};

/**
 * Get active sessions for a user
 */
const getActiveSessions = async (userId) => {
    return await RefreshToken.getActiveSessions(userId);
};

/**
 * Clean up expired tokens (can be run as a cron job)
 */
const cleanupExpiredTokens = async () => {
    const result = await RefreshToken.deleteMany({
        expiresAt: { $lt: new Date() }
    });

    return result.deletedCount;
};

module.exports = {
    createRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    getActiveSessions,
    cleanupExpiredTokens
};