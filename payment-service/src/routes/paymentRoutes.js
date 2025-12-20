const express = require('express');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getPaymentByOrderId,
  getUserPayments,
  refundPayment,
  cancelPayment,
  handleWebhook,
  getPaymentStats,
} = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const verifyWebhookSignature = require('../middlewares/webhookMiddleware');
const { paymentRateLimiter, strictRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Public routes
// Webhook endpoint - must use raw body, so handled separately in app.js
router.post('/webhook', handleWebhook);

// Protected routes - require authentication
// Note: Rate limiting is primarily handled at API Gateway level
// These rate limiters provide defense-in-depth protection
router.post('/intent', paymentRateLimiter, authMiddleware, createPaymentIntent);
router.post('/:paymentIntentId/confirm', paymentRateLimiter, authMiddleware, confirmPayment);
router.post('/:paymentIntentId/cancel', paymentRateLimiter, authMiddleware, cancelPayment);
router.get('/user', paymentRateLimiter, authMiddleware, getUserPayments);
router.get('/stats', paymentRateLimiter, authMiddleware, getPaymentStats);
router.get('/status/:paymentIntentId', paymentRateLimiter, authMiddleware, getPaymentStatus);
router.get('/order/:orderId', paymentRateLimiter, authMiddleware, getPaymentByOrderId);

// Admin routes - require authentication and admin role
router.post('/:paymentIntentId/refund', strictRateLimiter, authMiddleware, roleMiddleware(['admin']), refundPayment);

module.exports = router;
