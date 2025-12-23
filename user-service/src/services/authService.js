const userRepository = require("../repositories/userRepository");
const accountLockoutRepository = require("../repositories/accountLockoutRepository");
const refreshTokenRepository = require("../repositories/refreshTokenRepository");
const auditLogRepository = require("../repositories/auditLogRepository");
const generateToken = require("../utils/generateToken");
const { validateUserRegistration } = require("../utils/validation");
const { sanitizeInput } = require("../utils/validation");
const bcrypt = require("bcryptjs");
const EmailVerificationToken = require("../models/EmailVerificationToken");
const PasswordResetToken = require("../models/PasswordResetToken");
const logger = require("../utils/logger");

/**
 * Register a new user
 */
const registerUser = async (userData, ipAddress, userAgent) => {
  try {
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(userData.name),
      email: sanitizeInput(userData.email).toLowerCase(),
      password: userData.password, // Don't sanitize password
      phone: userData.phone ? sanitizeInput(userData.phone) : null
    };

    // Validate user data
    const validation = validateUserRegistration(sanitizedData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(sanitizedData.email);
    if (existingUser) {
      logger.warn(`Registration attempt with existing email: ${sanitizedData.email}`, { ipAddress });
      throw new Error("User with this email already exists");
    }

    // Create user
    const user = await userRepository.createUser(sanitizedData);

    // Create email verification token
    const verificationToken = await EmailVerificationToken.createVerificationToken(user._id);

    // Log audit event
    await auditLogRepository.logEvent({
      userId: user._id,
      email: user.email,
      action: 'REGISTER',
      ipAddress,
      userAgent,
      success: true,
      metadata: { emailVerificationSent: true }
    });

    logger.info(`User registered successfully: ${user.email}`, { userId: user._id });

    // TODO: Send verification email via notification service
    // This would be done by publishing a message to a queue or calling notification service API

    return {
      message: "User registered successfully. Please check your email to verify your account.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    };
  } catch (error) {
    logger.error(`Registration failed: ${error.message}`, { email: userData.email, ipAddress });
    throw error;
  }
};

/**
 * Verify user email
 */
const verifyEmail = async (token, ipAddress, userAgent) => {
  try {
    const user = await EmailVerificationToken.verifyToken(token);

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    // Update user email verification status
    await userRepository.verifyUserEmail(user._id);

    // Log audit event
    await auditLogRepository.logEvent({
      userId: user._id,
      email: user.email,
      action: 'EMAIL_VERIFIED',
      ipAddress,
      userAgent,
      success: true
    });

    logger.info(`Email verified successfully: ${user.email}`, { userId: user._id });

    return {
      message: "Email verified successfully. You can now log in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: true
      }
    };
  } catch (error) {
    logger.error(`Email verification failed: ${error.message}`, { token, ipAddress });
    throw error;
  }
};

/**
 * Resend verification email
 */
const resendVerificationEmail = async (email, ipAddress, userAgent) => {
  try {
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    
    const user = await userRepository.findByEmail(sanitizedEmail);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email is already verified");
    }

    // Create new verification token
    const verificationToken = await EmailVerificationToken.createVerificationToken(user._id);

    logger.info(`Verification email resent: ${user.email}`, { userId: user._id });

    // TODO: Send verification email via notification service

    return {
      message: "Verification email sent. Please check your inbox.",
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    };
  } catch (error) {
    logger.error(`Failed to resend verification email: ${error.message}`, { email, ipAddress });
    throw error;
  }
};

/**
 * Login user with account lockout protection
 */
const loginUser = async ({ email, password }, ipAddress, userAgent) => {
  const sanitizedEmail = sanitizeInput(email).toLowerCase();

  try {
    // Check if account is locked
    const lockoutInfo = await accountLockoutRepository.getLockoutInfo(sanitizedEmail);
    
    if (lockoutInfo.isLocked) {
      await auditLogRepository.logEvent({
        userId: null,
        email: sanitizedEmail,
        action: 'LOGIN_FAILURE',
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Account locked due to too many failed attempts',
        metadata: { lockTimeRemaining: lockoutInfo.lockTimeRemaining }
      });

      logger.warn(`Login attempt on locked account: ${sanitizedEmail}`, { ipAddress, lockTimeRemaining: lockoutInfo.lockTimeRemaining });
      
      throw new Error(`Account is locked due to too many failed login attempts. Please try again in ${lockoutInfo.lockTimeRemaining} minutes.`);
    }

    // Find user
    const user = await userRepository.findByEmail(sanitizedEmail);

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Increment failed attempts
      await accountLockoutRepository.incrementFailedAttempts(sanitizedEmail);

      // Log failed login attempt
      await auditLogRepository.logEvent({
        userId: user ? user._id : null,
        email: sanitizedEmail,
        action: 'LOGIN_FAILURE',
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Invalid credentials',
        metadata: { 
          remainingAttempts: lockoutInfo.remainingAttempts - 1
        }
      });

      logger.warn(`Failed login attempt: ${sanitizedEmail}`, { ipAddress });

      const newLockoutInfo = await accountLockoutRepository.getLockoutInfo(sanitizedEmail);
      
      if (newLockoutInfo.isLocked) {
        throw new Error(`Invalid credentials. Account is now locked for ${newLockoutInfo.lockTimeRemaining} minutes due to too many failed attempts.`);
      }

      throw new Error(`Invalid credentials. ${newLockoutInfo.remainingAttempts} attempts remaining before account lockout.`);
    }

    // Check if email is verified (optional - can be enforced or not)
    // if (!user.emailVerified) {
    //   throw new Error("Please verify your email before logging in");
    // }

    // Reset failed attempts on successful login
    await accountLockoutRepository.resetFailedAttempts(sanitizedEmail);

    // Update last login
    await userRepository.updateLastLogin(user._id);

    // Generate access token
    const tokenData = generateToken(user);

    // Create refresh token
    const refreshToken = await refreshTokenRepository.createRefreshToken(
      user._id,
      ipAddress,
      userAgent
    );

    // Log successful login
    await auditLogRepository.logEvent({
      userId: user._id,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      success: true
    });

    logger.info(`User logged in successfully: ${user.email}`, { userId: user._id, ipAddress });

    return {
      ...tokenData,
      refreshToken,
      user: {
        ...tokenData.user,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt
      }
    };
  } catch (error) {
    logger.error(`Login failed: ${error.message}`, { email: sanitizedEmail, ipAddress });
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken, ipAddress, userAgent) => {
  try {
    const tokenData = await refreshTokenRepository.verifyRefreshToken(refreshToken);

    if (!tokenData) {
      throw new Error("Invalid or expired refresh token");
    }

    const user = tokenData.userId;

    if (!user || user.isDeleted) {
      throw new Error("User not found or has been deleted");
    }

    // Generate new access token
    const newAccessToken = generateToken(user);

    // Create new refresh token and revoke old one (token rotation)
    const newRefreshToken = await refreshTokenRepository.createRefreshToken(
      user._id,
      ipAddress,
      userAgent
    );

    await refreshTokenRepository.revokeRefreshToken(refreshToken, newRefreshToken);

    // Log token refresh
    await auditLogRepository.logEvent({
      userId: user._id,
      email: user.email,
      action: 'TOKEN_REFRESHED',
      ipAddress,
      userAgent,
      success: true
    });

    logger.info(`Token refreshed: ${user.email}`, { userId: user._id });

    return {
      ...newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    logger.error(`Token refresh failed: ${error.message}`, { ipAddress });
    throw error;
  }
};

/**
 * Logout user
 */
const logout = async (refreshToken, userId, ipAddress, userAgent) => {
  try {
    if (refreshToken) {
      await refreshTokenRepository.revokeRefreshToken(refreshToken);
    }

    if (userId) {
      const user = await userRepository.findById(userId);
      
      if (user) {
        await auditLogRepository.logEvent({
          userId: user._id,
          email: user.email,
          action: 'LOGOUT',
          ipAddress,
          userAgent,
          success: true
        });

        logger.info(`User logged out: ${user.email}`, { userId: user._id });
      }
    }

    return { message: "Logged out successfully" };
  } catch (error) {
    logger.error(`Logout failed: ${error.message}`, { userId, ipAddress });
    throw error;
  }
};

/**
 * Logout from all devices
 */
const logoutAllDevices = async (userId, ipAddress, userAgent) => {
  try {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    await refreshTokenRepository.revokeAllUserTokens(userId);

    await auditLogRepository.logEvent({
      userId: user._id,
      email: user.email,
      action: 'LOGOUT_ALL_DEVICES',
      ipAddress,
      userAgent,
      success: true
    });

    logger.info(`User logged out from all devices: ${user.email}`, { userId: user._id });

    return { message: "Logged out from all devices successfully" };
  } catch (error) {
    logger.error(`Logout all devices failed: ${error.message}`, { userId, ipAddress });
    throw error;
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (email, ipAddress, userAgent) => {
  try {
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    
    const user = await userRepository.findByEmail(sanitizedEmail);

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${sanitizedEmail}`, { ipAddress });
      return { 
        message: "If an account with that email exists, a password reset link has been sent." 
      };
    }

    // Create password reset token
    const resetToken = await PasswordResetToken.createResetToken(user._id);

    // Log password reset request
    await auditLogRepository.logEvent({
      userId: user._id,
      email: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      ipAddress,
      userAgent,
      success: true
    });

    logger.info(`Password reset requested: ${user.email}`, { userId: user._id });

    // TODO: Send password reset email via notification service

    return { 
      message: "If an account with that email exists, a password reset link has been sent.",
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    };
  } catch (error) {
    logger.error(`Password reset request failed: ${error.message}`, { email, ipAddress });
    throw error;
  }
};

/**
 * Reset password using token
 */
const resetPassword = async (token, newPassword, ipAddress, userAgent) => {
  try {
    const { validatePasswordStrength } = require("../utils/passwordValidator");
    
    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Verify token
    const user = await PasswordResetToken.verifyToken(token);

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await userRepository.updatePassword(user._id, hashedPassword);

    // Revoke all refresh tokens for security
    await refreshTokenRepository.revokeAllUserTokens(user._id);

    // Reset any account lockout
    await accountLockoutRepository.resetFailedAttempts(user.email);

    // Log password reset
    await auditLogRepository.logEvent({
      userId: user._id,
      email: user.email,
      action: 'PASSWORD_RESET_COMPLETED',
      ipAddress,
      userAgent,
      success: true
    });

    logger.info(`Password reset completed: ${user.email}`, { userId: user._id });

    return { message: "Password reset successfully. Please log in with your new password." };
  } catch (error) {
    logger.error(`Password reset failed: ${error.message}`, { token, ipAddress });
    throw error;
  }
};

/**
 * Get active sessions for a user
 */
const getActiveSessions = async (userId) => {
  try {
    const sessions = await refreshTokenRepository.getActiveSessions(userId);
    
    return sessions.map(session => ({
      id: session._id,
      createdAt: session.createdAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    }));
  } catch (error) {
    logger.error(`Failed to get active sessions: ${error.message}`, { userId });
    throw error;
  }
};

module.exports = { 
  registerUser, 
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  requestPasswordReset,
  resetPassword,
  getActiveSessions
};
