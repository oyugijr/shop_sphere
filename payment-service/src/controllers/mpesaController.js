const mpesaService = require('../services/mpesaService');

/**
 * Initiate M-Pesa payment (STK Push)
 */
const initiateMpesaPayment = async (req, res) => {
  try {
    const { orderId, amount, phoneNumber, metadata = {} } = req.body;

    // Validate required fields
    if (!orderId || !amount || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields: orderId, amount, and phoneNumber are required',
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount: must be a positive number',
      });
    }

    const userId = req.user.id;

    const result = await mpesaService.initiateMpesaPayment(
      orderId,
      amount,
      phoneNumber,
      userId,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'STK Push sent successfully. Please check your phone to complete payment.',
      data: result,
    });
  } catch (error) {
    console.error('Error in initiateMpesaPayment:', error);
    res.status(500).json({
      error: 'Failed to initiate M-Pesa payment',
      message: error.message,
    });
  }
};

/**
 * Query M-Pesa payment status
 */
const queryMpesaPayment = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        error: 'Checkout request ID is required',
      });
    }

    const payment = await mpesaService.queryMpesaPayment(checkoutRequestId);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error in queryMpesaPayment:', error);
    res.status(500).json({
      error: 'Failed to query M-Pesa payment',
      message: error.message,
    });
  }
};

/**
 * Handle M-Pesa callback
 */
const handleMpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    const result = await mpesaService.handleMpesaCallback(callbackData);

    // Always return success to M-Pesa to prevent retries
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success',
    });
  } catch (error) {
    console.error('Error in handleMpesaCallback:', error);
    // Still return success to M-Pesa to prevent retries
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success',
    });
  }
};

/**
 * Get M-Pesa payment by order ID
 */
const getMpesaPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required',
      });
    }

    const payment = await mpesaService.getMpesaPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({
        error: 'M-Pesa payment not found for this order',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error in getMpesaPaymentByOrderId:', error);
    res.status(500).json({
      error: 'Failed to get M-Pesa payment',
      message: error.message,
    });
  }
};

/**
 * Refund M-Pesa payment (B2C)
 */
const refundMpesaPayment = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const { amount } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({
        error: 'Checkout request ID is required',
      });
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({
        error: 'Invalid refund amount',
      });
    }

    const payment = await mpesaService.refundMpesaPayment(checkoutRequestId, amount);

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: payment,
    });
  } catch (error) {
    console.error('Error in refundMpesaPayment:', error);
    res.status(500).json({
      error: 'Failed to process M-Pesa refund',
      message: error.message,
    });
  }
};

module.exports = {
  initiateMpesaPayment,
  queryMpesaPayment,
  handleMpesaCallback,
  getMpesaPaymentByOrderId,
  refundMpesaPayment,
};
