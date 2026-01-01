const mongoose = require('mongoose');

/**
 * Audit Log Model
 * Tracks security-related events for compliance and monitoring
 */
const AuditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null // Can be null for failed login attempts
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        action: {
            type: String,
            required: true,
            enum: [
                'LOGIN_SUCCESS',
                'LOGIN_FAILURE',
                'LOGOUT',
                'LOGOUT_ALL_DEVICES',
                'REGISTER',
                'EMAIL_VERIFIED',
                'PASSWORD_CHANGED',
                'PASSWORD_RESET_REQUESTED',
                'PASSWORD_RESET_COMPLETED',
                'PROFILE_UPDATED',
                'ROLE_CHANGED',
                'ACCOUNT_LOCKED',
                'ACCOUNT_DELETED',
                'TOKEN_REFRESHED',
                'SESSION_REVOKED'
            ]
        },
        ipAddress: {
            type: String,
            required: true
        },
        userAgent: {
            type: String,
            default: null
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        success: {
            type: Boolean,
            default: true
        },
        errorMessage: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ email: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ ipAddress: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

/**
 * Create an audit log entry
 */
AuditLogSchema.statics.log = async function (data) {
    try {
        return await this.create(data);
    } catch (error) {
        // Don't let audit logging failures break the application
        console.error('Failed to create audit log:', error);
        return null;
    }
};

/**
 * Get audit logs for a user
 */
AuditLogSchema.statics.getUserLogs = async function (userId, limit = 50) {
    return await this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-__v');
};

/**
 * Get failed login attempts for an email
 */
AuditLogSchema.statics.getFailedLoginAttempts = async function (email, since) {
    const query = {
        email,
        action: 'LOGIN_FAILURE',
        success: false
    };

    if (since) {
        query.createdAt = { $gte: since };
    }

    return await this.find(query).sort({ createdAt: -1 });
};

/**
 * Get suspicious activity (multiple failed attempts from same IP)
 */
AuditLogSchema.statics.getSuspiciousActivity = async function (ipAddress, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await this.find({
        ipAddress,
        action: 'LOGIN_FAILURE',
        success: false,
        createdAt: { $gte: since }
    }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);