const paymentService = require('../services/paymentService');

/**
 * Create a new payment intent
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, amount, currency = 'usd', metadata = {} } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: orderId and amount are required',
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount: must be a positive number',
      });
    }

    const userId = req.user.id;

    const result = await paymentService.createPaymentIntent(
      orderId,
      amount,
      currency,
      userId,
      metadata,
      req.fraudContext || {}
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in createPaymentIntent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      message: error.message,
    });
  }
};

/**
 * Confirm a payment
 */
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required',
      });
    }

    const payment = await paymentService.confirmPayment(paymentIntentId);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error in confirmPayment:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      message: error.message,
    });
  }
};

/**
 * Get payment status by payment intent ID
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required',
      });
    }

    const payment = await paymentService.getPaymentStatus(paymentIntentId);

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error in getPaymentStatus:', error);
    res.status(500).json({
      error: 'Failed to get payment status',
      message: error.message,
    });
  }
};

/**
 * Get payment by order ID
 */
const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required',
      });
    }

    const payment = await paymentService.getPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found for this order',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error in getPaymentByOrderId:', error);
    res.status(500).json({
      error: 'Failed to get payment',
      message: error.message,
    });
  }
};

/**
 * Get user payment history
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const payments = await paymentService.getUserPayments(userId, limit);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Error in getUserPayments:', error);
    res.status(500).json({
      error: 'Failed to get user payments',
      message: error.message,
    });
  }
};

/**
 * Refund a payment
 */
const refundPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const { amount } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required',
      });
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({
        error: 'Invalid refund amount',
      });
    }

    const payment = await paymentService.refundPayment(paymentIntentId, amount);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error in refundPayment:', error);
    res.status(500).json({
      error: 'Failed to process refund',
      message: error.message,
    });
  }
};

/**
 * Cancel a payment
 */
const cancelPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required',
      });
    }

    const payment = await paymentService.cancelPayment(paymentIntentId);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error in cancelPayment:', error);
    res.status(500).json({
      error: 'Failed to cancel payment',
      message: error.message,
    });
  }
};

/**
 * Handle Stripe webhook events
 */
const handleWebhook = async (req, res) => {
  try {
    const event = req.body;

    const result = await paymentService.handleWebhook(event);

    res.status(200).json({
      success: true,
      received: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in handleWebhook:', error);
    res.status(500).json({
      error: 'Webhook handler failed',
      message: error.message,
    });
  }
};

/**
 * Get payment statistics
 */
const getPaymentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const stats = await paymentService.getPaymentStats(userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    res.status(500).json({
      error: 'Failed to get payment statistics',
      message: error.message,
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getPaymentByOrderId,
  getUserPayments,
  refundPayment,
  cancelPayment,
  handleWebhook,
  getPaymentStats,
};
