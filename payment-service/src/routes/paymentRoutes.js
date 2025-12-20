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

const router = express.Router();

// Public routes
// Webhook endpoint - must use raw body, so handled separately in app.js
router.post('/webhook', handleWebhook);

// Protected routes - require authentication
router.post('/intent', authMiddleware, createPaymentIntent);
router.post('/:paymentIntentId/confirm', authMiddleware, confirmPayment);
router.post('/:paymentIntentId/cancel', authMiddleware, cancelPayment);
router.get('/user', authMiddleware, getUserPayments);
router.get('/stats', authMiddleware, getPaymentStats);
router.get('/status/:paymentIntentId', authMiddleware, getPaymentStatus);
router.get('/order/:orderId', authMiddleware, getPaymentByOrderId);

// Admin routes - require authentication and admin role
router.post('/:paymentIntentId/refund', authMiddleware, roleMiddleware(['admin']), refundPayment);

module.exports = router;
