const userService = require("../services/userService");

class UserController {
  /**
   * Get user profile (self)
   */
  async getUserProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.userId);
      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile (self)
   */
  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateUserProfile(
        req.user.userId,
        req.body,
        req.clientIp,
        req.userAgent
      );
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password (self)
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await userService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword,
        req.clientIp,
        req.userAgent
      );
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user audit logs (self)
   */
  async getAuditLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await userService.getUserAuditLogs(req.user.userId, limit);
      res.status(200).json({
        success: true,
        logs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const role = req.query.role;
      const emailVerified = req.query.emailVerified;

      const filters = {};
      if (role) filters.role = role;
      if (emailVerified !== undefined) filters.emailVerified = emailVerified === 'true';

      const result = await userService.getAllUsers(filters, { page, limit });
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;
      const user = await userService.updateUserRole(
        req.user.userId,
        req.params.id,
        role,
        req.clientIp,
        req.userAgent
      );
      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(
        req.user.userId,
        req.params.id,
        req.clientIp,
        req.userAgent
      );
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user audit logs by ID (admin only)
   */
  async getUserAuditLogsById(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await userService.getUserAuditLogs(req.params.id, limit);
      res.status(200).json({
        success: true,
        logs
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();