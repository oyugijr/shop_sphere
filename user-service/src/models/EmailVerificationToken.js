const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Email Verification Token Model
 * Stores tokens for email verification functionality
 */
const EmailVerificationTokenSchema = new mongoose.Schema(
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
EmailVerificationTokenSchema.index({ token: 1 });
EmailVerificationTokenSchema.index({ userId: 1 });
EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Generate a secure verification token
 */
EmailVerificationTokenSchema.statics.generateToken = function () {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Create an email verification token for a user
 */
EmailVerificationTokenSchema.statics.createVerificationToken = async function (userId) {
    // Invalidate any existing tokens for this user
    await this.updateMany(
        { userId, used: false },
        { used: true, usedAt: new Date() }
    );

    // Generate new token
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verificationToken = await this.create({
        userId,
        token,
        expiresAt
    });

    return verificationToken.token;
};

/**
 * Verify and mark token as used
 */
EmailVerificationTokenSchema.statics.verifyToken = async function (token) {
    const verificationToken = await this.findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!verificationToken) {
        return null;
    }

    // Mark as used
    verificationToken.used = true;
    verificationToken.usedAt = new Date();
    await verificationToken.save();

    return verificationToken.userId;
};

module.exports = mongoose.model('EmailVerificationToken', EmailVerificationTokenSchema);