const authService = require("../services/authService");

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const result = await authService.registerUser(
        req.body,
        req.clientIp,
        req.userAgent
      );
      res.status(201).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const result = await authService.loginUser(
        req.body,
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
   * Verify email
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(
        token,
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
   * Resend verification email
   */
  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationEmail(
        email,
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
   * Refresh access token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(
        refreshToken,
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
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(
        refreshToken,
        req.user?.userId,
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
   * Logout from all devices
   */
  async logoutAllDevices(req, res, next) {
    try {
      const result = await authService.logoutAllDevices(
        req.user.userId,
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
   * Request password reset
   */
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(
        email,
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
   * Reset password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(
        token,
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
   * Get active sessions
   */
  async getActiveSessions(req, res, next) {
    try {
      const sessions = await authService.getActiveSessions(req.user.userId);
      res.status(200).json({
        success: true,
        sessions
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
