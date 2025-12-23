const mongoose = require('mongoose');

/**
 * Account Lockout Model
 * Tracks failed login attempts and account lockout status
 */
const AccountLockoutSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        failedAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date,
            default: null
        },
        lastFailedAttempt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Constants
AccountLockoutSchema.statics.MAX_FAILED_ATTEMPTS = 5;
AccountLockoutSchema.statics.LOCK_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Check if account is currently locked
 */
AccountLockoutSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increment failed login attempts
 */
AccountLockoutSchema.methods.incrementFailedAttempts = async function () {
    // Reset if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.failedAttempts = 1;
        this.lockUntil = null;
        this.lastFailedAttempt = new Date();
        return await this.save();
    }

    // Increment attempts
    this.failedAttempts += 1;
    this.lastFailedAttempt = new Date();

    // Lock account if max attempts reached
    if (this.failedAttempts >= AccountLockoutSchema.statics.MAX_FAILED_ATTEMPTS) {
        this.lockUntil = new Date(Date.now() + AccountLockoutSchema.statics.LOCK_TIME);
    }

    return await this.save();
};

/**
 * Reset failed attempts on successful login
 */
AccountLockoutSchema.methods.resetFailedAttempts = async function () {
    if (this.failedAttempts > 0 || this.lockUntil) {
        this.failedAttempts = 0;
        this.lockUntil = null;
        this.lastFailedAttempt = null;
        return await this.save();
    }
};

/**
 * Get time remaining for lockout
 */
AccountLockoutSchema.methods.getLockTimeRemaining = function () {
    if (!this.isLocked()) return 0;
    return Math.ceil((this.lockUntil - Date.now()) / 1000 / 60); // minutes
};

module.exports = mongoose.model('AccountLockout', AccountLockoutSchema);