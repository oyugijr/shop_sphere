const express = require('express');
const {
  createPayPalOrder,
  capturePayPalPayment,
  getPayPalPaymentStatus,
  getPayPalPaymentByOrderId,
  refundPayPalPayment,
  cancelPayPalOrder,
} = require('../controllers/paypalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { paymentRateLimiter, strictRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Protected routes - require authentication
router.post('/create', paymentRateLimiter, authMiddleware, createPayPalOrder);
router.post('/:paypalOrderId/capture', paymentRateLimiter, authMiddleware, capturePayPalPayment);
router.post('/:paypalOrderId/cancel', paymentRateLimiter, authMiddleware, cancelPayPalOrder);
router.get('/status/:paypalOrderId', paymentRateLimiter, authMiddleware, getPayPalPaymentStatus);
router.get('/order/:orderId', paymentRateLimiter, authMiddleware, getPayPalPaymentByOrderId);

// Admin routes - require authentication and admin role
router.post('/:paypalOrderId/refund', strictRateLimiter, authMiddleware, roleMiddleware(['admin']), refundPayPalPayment);

module.exports = router;
