const express = require('express');
const {
  initiateMpesaPayment,
  queryMpesaPayment,
  handleMpesaCallback,
  getMpesaPaymentByOrderId,
  refundMpesaPayment,
} = require('../controllers/mpesaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { paymentRateLimiter, strictRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Public routes
// M-Pesa callback endpoint - no authentication required
router.post('/callback', handleMpesaCallback);

// Protected routes - require authentication
router.post('/initiate', paymentRateLimiter, authMiddleware, initiateMpesaPayment);
router.get('/query/:checkoutRequestId', paymentRateLimiter, authMiddleware, queryMpesaPayment);
router.get('/order/:orderId', paymentRateLimiter, authMiddleware, getMpesaPaymentByOrderId);

// Admin routes - require authentication and admin role
router.post('/:checkoutRequestId/refund', strictRateLimiter, authMiddleware, roleMiddleware(['admin']), refundMpesaPayment);

module.exports = router;
