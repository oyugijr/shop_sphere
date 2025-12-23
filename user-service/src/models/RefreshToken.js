const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Refresh Token Model
 * Stores refresh tokens for JWT refresh mechanism
 */
const RefreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        token: {
            type: String,
            required: true,
            unique: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        revoked: {
            type: Boolean,
            default: false
        },
        revokedAt: {
            type: Date,
            default: null
        },
        replacedByToken: {
            type: String,
            default: null
        },
        // Track device/session information
        userAgent: {
            type: String,
            default: null
        },
        ipAddress: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

// Index for faster lookups
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Generate a secure refresh token
 */
RefreshTokenSchema.statics.generateToken = function () {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Create a refresh token for a user
 */
RefreshTokenSchema.statics.createRefreshToken = async function (userId, ipAddress, userAgent) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const refreshToken = await this.create({
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent
    });

    return refreshToken.token;
};

/**
 * Verify token and return user if valid
 */
RefreshTokenSchema.statics.verifyToken = async function (token) {
    const refreshToken = await this.findOne({
        token,
        revoked: false,
        expiresAt: { $gt: new Date() }
    }).populate('userId');

    return refreshToken;
};

/**
 * Revoke a refresh token
 */
RefreshTokenSchema.methods.revoke = async function (replacedByToken = null) {
    this.revoked = true;
    this.revokedAt = new Date();
    if (replacedByToken) {
        this.replacedByToken = replacedByToken;
    }
    return await this.save();
};

/**
 * Revoke all tokens for a user (logout from all devices)
 */
RefreshTokenSchema.statics.revokeAllUserTokens = async function (userId) {
    return await this.updateMany(
        { userId, revoked: false },
        { revoked: true, revokedAt: new Date() }
    );
};

/**
 * Get active sessions for a user
 */
RefreshTokenSchema.statics.getActiveSessions = async function (userId) {
    return await this.find({
        userId,
        revoked: false,
        expiresAt: { $gt: new Date() }
    }).select('createdAt ipAddress userAgent').sort({ createdAt: -1 });
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);