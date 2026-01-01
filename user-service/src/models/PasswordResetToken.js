const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Password Reset Token Model
 * Stores tokens for password reset functionality
 */
const PasswordResetTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        used: {
            type: Boolean,
            default: false
        },
        usedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Index for faster lookups
PasswordResetTokenSchema.index({ token: 1 });
PasswordResetTokenSchema.index({ userId: 1 });
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Generate a secure reset token
 */
PasswordResetTokenSchema.statics.generateToken = function () {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a password reset token for a user
 */
PasswordResetTokenSchema.statics.createResetToken = async function (userId) {
    // Invalidate any existing tokens for this user
    await this.updateMany(
        { userId, used: false },
        { used: true, usedAt: new Date() }
    );

    // Generate new token
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const resetToken = await this.create({
        userId,
        token,
        expiresAt
    });

    return resetToken.token;
};

/**
 * Verify and mark token as used
 */
PasswordResetTokenSchema.statics.verifyToken = async function (token) {
    const resetToken = await this.findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!resetToken) {
        return null;
    }

    // Mark as used
    resetToken.used = true;
    resetToken.usedAt = new Date();
    await resetToken.save();

    return resetToken.userId;
};

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);