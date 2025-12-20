const paypalService = require('../services/paypalService');

/**
 * Create PayPal order
 */
const createPayPalOrder = async (req, res) => {
  try {
    const { orderId, amount, currency = 'USD', metadata = {} } = req.body;

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

    const result = await paypalService.createPayPalOrder(
      orderId,
      amount,
      currency,
      userId,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'PayPal order created successfully. Redirect customer to approval URL.',
      data: result,
    });
  } catch (error) {
    console.error('Error in createPayPalOrder:', error);
    res.status(500).json({
      error: 'Failed to create PayPal order',
      message: error.message,
    });
  }
};

/**
 * Capture PayPal payment after customer approval
 */
const capturePayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId } = req.params;

    if (!paypalOrderId) {
      return res.status(400).json({
        error: 'PayPal order ID is required',
      });
    }

    const payment = await paypalService.capturePayPalPayment(paypalOrderId);

    res.status(200).json({
      success: true,
      message: 'Payment captured successfully',
      data: payment,
    });
  } catch (error) {
    console.error('Error in capturePayPalPayment:', error);
    res.status(500).json({
      error: 'Failed to capture PayPal payment',
      message: error.message,
    });
  }
};

/**
 * Get PayPal payment status
 */
const getPayPalPaymentStatus = async (req, res) => {
  try {
    const { paypalOrderId } = req.params;

    if (!paypalOrderId) {
      return res.status(400).json({
        error: 'PayPal order ID is required',
      });
    }

    const payment = await paypalService.getPayPalPaymentStatus(paypalOrderId);

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
    console.error('Error in getPayPalPaymentStatus:', error);
    res.status(500).json({
      error: 'Failed to get PayPal payment status',
      message: error.message,
    });
  }
};

/**
 * Get PayPal payment by order ID
 */
const getPayPalPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required',
      });
    }

    const payment = await paypalService.getPayPalPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({
        error: 'PayPal payment not found for this order',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error in getPayPalPaymentByOrderId:', error);
    res.status(500).json({
      error: 'Failed to get PayPal payment',
      message: error.message,
    });
  }
};

/**
 * Refund PayPal payment
 */
const refundPayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId } = req.params;
    const { amount } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({
        error: 'PayPal order ID is required',
      });
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({
        error: 'Invalid refund amount',
      });
    }

    const payment = await paypalService.refundPayPalPayment(paypalOrderId, amount);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: payment,
    });
  } catch (error) {
    console.error('Error in refundPayPalPayment:', error);
    res.status(500).json({
      error: 'Failed to process PayPal refund',
      message: error.message,
    });
  }
};

/**
 * Cancel PayPal order
 */
const cancelPayPalOrder = async (req, res) => {
  try {
    const { paypalOrderId } = req.params;

    if (!paypalOrderId) {
      return res.status(400).json({
        error: 'PayPal order ID is required',
      });
    }

    const payment = await paypalService.cancelPayPalOrder(paypalOrderId);

    res.status(200).json({
      success: true,
      message: 'PayPal order canceled successfully',
      data: payment,
    });
  } catch (error) {
    console.error('Error in cancelPayPalOrder:', error);
    res.status(500).json({
      error: 'Failed to cancel PayPal order',
      message: error.message,
    });
  }
};

module.exports = {
  createPayPalOrder,
  capturePayPalPayment,
  getPayPalPaymentStatus,
  getPayPalPaymentByOrderId,
  refundPayPalPayment,
  cancelPayPalOrder,
};
