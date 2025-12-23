const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { 
  authLimiter, 
  passwordResetLimiter, 
  emailVerificationLimiter 
} = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Public routes with rate limiting
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", emailVerificationLimiter, authController.resendVerification);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", passwordResetLimiter, authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);

// Protected routes (require authentication)
router.post("/logout", authMiddleware, authController.logout);
router.post("/logout-all", authMiddleware, authController.logoutAllDevices);
router.get("/sessions", authMiddleware, authController.getActiveSessions);

module.exports = router;
