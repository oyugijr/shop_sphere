const userRepository = require("../repositories/userRepository");
const auditLogRepository = require("../repositories/auditLogRepository");
const { validateUserUpdate, validatePasswordChange } = require("../utils/validation");
const { sanitizeInput } = require("../utils/validation");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

/**
 * Get user by ID (public profile info)
 */
const getUserById = async (id) => {
    try {
        const user = await userRepository.findById(id);

        if (!user) {
            throw new Error("User not found");
        }
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
            phone: user.phone,
            address: user.address,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
        };
    } catch (error) {
        logger.error(`Failed to get user by ID: ${error.message}`, { userId: id });
        throw error;
    }
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updateData, ipAddress, userAgent) => {
    try {
        // Sanitize inputs
        const sanitizedData = {};
        if (updateData.name) sanitizedData.name = sanitizeInput(updateData.name);
        if (updateData.phone) sanitizedData.phone = sanitizeInput(updateData.phone);
        if (updateData.address) {
            sanitizedData.address = {
                street: updateData.address.street ? sanitizeInput(updateData.address.street) : null,
                city: updateData.address.city ? sanitizeInput(updateData.address.city) : null,
                state: updateData.address.state ? sanitizeInput(updateData.address.state) : null,
                country: updateData.address.country ? sanitizeInput(updateData.address.country) : null,
                zipCode: updateData.address.zipCode ? sanitizeInput(updateData.address.zipCode) : null
            };
        }

        // Validate update data
        const validation = validateUserUpdate(sanitizedData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Update user
        const updatedUser = await userRepository.updateUser(userId, sanitizedData);

        if (!updatedUser) {
            throw new Error("User not found");
        }

        // Log audit event
        await auditLogRepository.logEvent({
            userId: updatedUser._id,
            email: updatedUser.email,
            action: 'PROFILE_UPDATED',
            ipAddress,
            userAgent,
            success: true,
            metadata: { updatedFields: Object.keys(sanitizedData) }
        });

        logger.info(`User profile updated: ${updatedUser.email}`, { userId: updatedUser._id });

        return {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            emailVerified: updatedUser.emailVerified,
            phone: updatedUser.phone,
            address: updatedUser.address,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };
    } catch (error) {
        logger.error(`Failed to update user profile: ${error.message}`, { userId, ipAddress });
        throw error;
    }
};

/**
 * Change user password
 */
const changePassword = async (userId, currentPassword, newPassword, ipAddress, userAgent) => {
    try {
        // Validate password change data
        const validation = validatePasswordChange({ currentPassword, newPassword });
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Get user
        const user = await userRepository.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            await auditLogRepository.logEvent({
                userId: user._id,
                email: user.email,
                action: 'PASSWORD_CHANGED',
                ipAddress,
                userAgent,
                success: false,
                errorMessage: 'Current password is incorrect'
            });

            throw new Error("Current password is incorrect");
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await userRepository.updatePassword(userId, hashedPassword);

        // Log successful password change
        await auditLogRepository.logEvent({
            userId: user._id,
            email: user.email,
            action: 'PASSWORD_CHANGED',
            ipAddress,
            userAgent,
            success: true
        });

        logger.info(`Password changed successfully: ${user.email}`, { userId: user._id });

        return { message: "Password changed successfully" };
    } catch (error) {
        logger.error(`Failed to change password: ${error.message}`, { userId, ipAddress });
        throw error;
    }
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async (filters = {}, options = {}) => {
    try {
        const result = await userRepository.findAll(filters, options);

        return {
            users: result.users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
                phone: user.phone,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt
            })),
            pagination: result.pagination
        };
    } catch (error) {
        logger.error(`Failed to get all users: ${error.message}`);
        throw error;
    }
};

/**
 * Update user role (admin only)
 */
const updateUserRole = async (adminUserId, targetUserId, newRole, ipAddress, userAgent) => {
    try {
        if (!['user', 'admin'].includes(newRole)) {
            throw new Error("Invalid role. Must be 'user' or 'admin'");
        }

        const targetUser = await userRepository.findById(targetUserId);

        if (!targetUser) {
            throw new Error("User not found");
        }

        // Don't allow users to change their own role
        if (adminUserId === targetUserId) {
            throw new Error("You cannot change your own role");
        }

        // Update role
        const updatedUser = await userRepository.updateUserRole(targetUserId, newRole);

        // Log role change
        await auditLogRepository.logEvent({
            userId: targetUser._id,
            email: targetUser.email,
            action: 'ROLE_CHANGED',
            ipAddress,
            userAgent,
            success: true,
            metadata: {
                oldRole: targetUser.role,
                newRole,
                changedBy: adminUserId
            }
        });

        logger.info(`User role changed: ${targetUser.email} from ${targetUser.role} to ${newRole}`, {
            userId: targetUser._id,
            adminUserId
        });

        return {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
        };
    } catch (error) {
        logger.error(`Failed to update user role: ${error.message}`, { adminUserId, targetUserId, ipAddress });
        throw error;
    }
};

/**
 * Soft delete user (admin only)
 */
const deleteUser = async (adminUserId, targetUserId, ipAddress, userAgent) => {
    try {
        const targetUser = await userRepository.findById(targetUserId);

        if (!targetUser) {
            throw new Error("User not found");
        }

        // Don't allow users to delete themselves
        if (adminUserId === targetUserId) {
            throw new Error("You cannot delete your own account");
        }

        // Soft delete user
        await userRepository.softDeleteUser(targetUserId);

        // Log account deletion
        await auditLogRepository.logEvent({
            userId: targetUser._id,
            email: targetUser.email,
            action: 'ACCOUNT_DELETED',
            ipAddress,
            userAgent,
            success: true,
            metadata: { deletedBy: adminUserId }
        });

        logger.info(`User account deleted: ${targetUser.email}`, {
            userId: targetUser._id,
            adminUserId
        });

        return { message: "User account deleted successfully" };
    } catch (error) {
        logger.error(`Failed to delete user: ${error.message}`, { adminUserId, targetUserId, ipAddress });
        throw error;
    }
};

/**
 * Get user audit logs
 */
const getUserAuditLogs = async (userId, limit = 50) => {
    try {
        const logs = await auditLogRepository.getUserLogs(userId, limit);
        return logs;
    } catch (error) {
        logger.error(`Failed to get user audit logs: ${error.message}`, { userId });
        throw error;
    }
};

module.exports = {
    getUserById,
    updateUserProfile,
    changePassword,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getUserAuditLogs
};
