const paypalClient = require('../config/paypal');
const paymentRepository = require('../repositories/paymentRepository');

/**
 * Create PayPal order
 * @param {string} orderId - The order ID
 * @param {number} amount - Amount in base currency (e.g., 99.99)
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} userId - User ID
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} PayPal order with approval URL
 */
const createPayPalOrder = async (orderId, amount, currency = 'USD', userId, metadata = {}) => {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Create PayPal order
    const paypalOrder = await paypalClient.createOrder(amount, currency, {
      orderId,
      description: metadata.description || `Order ${orderId}`,
      ...metadata,
    });

    // Store payment record in database
    const payment = await paymentRepository.create({
      orderId,
      userId,
      provider: 'paypal',
      paypalOrderId: paypalOrder.id,
      amount: amount,
      currency: currency.toLowerCase(),
      status: 'pending',
      metadata,
    });

    // Extract approval URL from links
    const approvalUrl = paypalOrder.links?.find(link => link.rel === 'approve')?.href;

    return {
      paypalOrderId: paypalOrder.id,
      status: paypalOrder.status,
      approvalUrl,
      payment,
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
};

/**
 * Capture PayPal payment
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise<object>} Updated payment record
 */
const capturePayPalPayment = async (paypalOrderId) => {
  try {
    // Capture payment with PayPal
    const captureResult = await paypalClient.captureOrder(paypalOrderId);

    // Determine status based on capture result
    let status = 'processing';
    let captureId = null;
    let payerEmail = null;
    let payerId = null;

    if (captureResult.status === 'COMPLETED') {
      status = 'succeeded';
      
      // Extract capture details
      if (captureResult.purchaseUnits && captureResult.purchaseUnits.length > 0) {
        const capture = captureResult.purchaseUnits[0].payments?.captures?.[0];
        if (capture) {
          captureId = capture.id;
        }
      }

      // Extract payer details
      if (captureResult.payer) {
        payerEmail = captureResult.payer.emailAddress;
        payerId = captureResult.payer.payerId;
      }
    } else {
      status = 'failed';
    }

    // Update payment in database
    const payment = await paymentRepository.updateByPayPalOrderId(paypalOrderId, status, {
      paypalCaptureId: captureId,
      paypalPayerEmail: payerEmail,
      paypalPayerId: payerId,
      paymentMethod: 'paypal',
    });

    return payment;
  } catch (error) {
    // Update payment status to failed
    await paymentRepository.updateByPayPalOrderId(paypalOrderId, 'failed', {
      errorMessage: error.message,
    });
    console.error('Error capturing PayPal payment:', error);
    throw error;
  }
};

/**
 * Get PayPal payment status
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise<object|null>} Payment record or null
 */
const getPayPalPaymentStatus = async (paypalOrderId) => {
  try {
    // Get payment from database
    const payment = await paymentRepository.findByPayPalOrderId(paypalOrderId);

    if (!payment) {
      return null;
    }

    // If payment is still pending, check with PayPal for updates
    if (payment.status === 'pending') {
      const orderDetails = await paypalClient.getOrderDetails(paypalOrderId);
      
      // Update status if order was approved or completed
      if (orderDetails.status === 'APPROVED') {
        payment.status = 'processing';
        await payment.save();
      } else if (orderDetails.status === 'COMPLETED') {
        payment.status = 'succeeded';
        await payment.save();
      } else if (orderDetails.status === 'VOIDED' || orderDetails.status === 'CANCELLED') {
        payment.status = 'canceled';
        await payment.save();
      }
    }

    return payment;
  } catch (error) {
    console.error('Error getting PayPal payment status:', error);
    throw error;
  }
};

/**
 * Get payment by order ID
 */
const getPayPalPaymentByOrderId = async (orderId) => {
  try {
    return await paymentRepository.findByOrderId(orderId, 'paypal');
  } catch (error) {
    console.error('Error getting PayPal payment:', error);
    throw error;
  }
};

/**
 * Refund PayPal payment
 * @param {string} paypalOrderId - PayPal order ID
 * @param {number} amount - Amount to refund (optional, defaults to full refund)
 * @returns {Promise<object>} Updated payment record
 */
const refundPayPalPayment = async (paypalOrderId, amount = null) => {
  try {
    // Find payment
    const payment = await paymentRepository.findByPayPalOrderId(paypalOrderId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund successful payments');
    }

    if (!payment.paypalCaptureId) {
      throw new Error('No capture ID found for this payment');
    }

    // Determine refund amount
    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    // Process refund with PayPal
    const refundResult = await paypalClient.refundPayment(
      payment.paypalCaptureId,
      refundAmount,
      payment.currency.toUpperCase()
    );

    // Update payment in database
    const updatedPayment = await paymentRepository.updateByPayPalOrderId(
      paypalOrderId,
      'refunded',
      {
        refundId: refundResult.id,
        refundAmount: refundAmount,
      }
    );

    return updatedPayment;
  } catch (error) {
    console.error('Error processing PayPal refund:', error);
    throw error;
  }
};

/**
 * Cancel PayPal order (before capture)
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise<object>} Updated payment record
 */
const cancelPayPalOrder = async (paypalOrderId) => {
  try {
    // Update payment in database
    const payment = await paymentRepository.updateByPayPalOrderId(paypalOrderId, 'canceled');

    return payment;
  } catch (error) {
    console.error('Error canceling PayPal order:', error);
    throw error;
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
