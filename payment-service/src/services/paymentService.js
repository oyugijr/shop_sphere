const stripe = require('../config/stripe');
const paymentRepository = require('../repositories/paymentRepository');

/**
 * Create a payment intent with Stripe
 * @param {string} orderId - The order ID
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code (default: 'usd')
 * @param {string} userId - User ID
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Payment intent with client secret
 */
const createPaymentIntent = async (orderId, amount, currency = 'usd', userId, metadata = {}) => {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        userId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment record in database
    const payment = await paymentRepository.create({
      orderId,
      userId,
      stripePaymentIntentId: paymentIntent.id,
      amount: amount / 100, // Convert cents to dollars for storage
      currency: currency.toLowerCase(),
      status: 'pending',
      metadata,
    });

    return {
      paymentIntentId: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
      payment,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<object>} Updated payment record
 */
const confirmPayment = async (paymentIntentId) => {
  try {
    // Confirm with Stripe
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    // Map Stripe status to our status
    let status = 'processing';
    if (paymentIntent.status === 'succeeded') {
      status = 'succeeded';
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
      status = 'failed';
    }

    // Update payment in database
    const payment = await paymentRepository.updateStatus(paymentIntentId, status);

    return payment;
  } catch (error) {
    // Update payment status to failed
    await paymentRepository.updateStatus(paymentIntentId, 'failed', {
      errorMessage: error.message,
    });
    console.error('Error confirming payment:', error);
    throw error;
  }
};

/**
 * Get payment status by payment intent ID
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<object|null>} Payment record or null
 */
const getPaymentStatus = async (paymentIntentId) => {
  try {
    return await paymentRepository.findByStripeId(paymentIntentId);
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

/**
 * Get payment by order ID
 * @param {string} orderId - Order ID
 * @returns {Promise<object|null>} Payment record or null
 */
const getPaymentByOrderId = async (orderId) => {
  try {
    return await paymentRepository.findByOrderId(orderId);
  } catch (error) {
    console.error('Error getting payment by order ID:', error);
    throw error;
  }
};

/**
 * Get user payment history
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} Array of payment records
 */
const getUserPayments = async (userId, limit = 50) => {
  try {
    return await paymentRepository.findByUserId(userId, limit);
  } catch (error) {
    console.error('Error getting user payments:', error);
    throw error;
  }
};

/**
 * Refund a payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {number} amount - Amount to refund in cents (optional, defaults to full refund)
 * @returns {Promise<object>} Updated payment record
 */
const refundPayment = async (paymentIntentId, amount = null) => {
  try {
    // Retrieve the payment intent to get the charge
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.latest_charge) {
      throw new Error('No charge found for this payment intent');
    }

    // Create refund
    const refundParams = {
      charge: paymentIntent.latest_charge,
    };

    if (amount) {
      refundParams.amount = amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    // Update payment in database
    const payment = await paymentRepository.addRefund(
      paymentIntentId,
      refund.id,
      refund.amount / 100 // Convert cents to dollars
    );

    return payment;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Cancel a payment intent (before payment is completed)
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<object>} Updated payment record
 */
const cancelPayment = async (paymentIntentId) => {
  try {
    // Cancel with Stripe
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    // Update payment in database
    const payment = await paymentRepository.updateStatus(paymentIntentId, 'canceled');

    return payment;
  } catch (error) {
    console.error('Error canceling payment:', error);
    throw error;
  }
};

/**
 * Handle Stripe webhook events
 * @param {object} event - Stripe webhook event
 * @returns {Promise<object|null>} Updated payment or null
 */
const handleWebhook = async (event) => {
  try {
    const paymentIntent = event.data.object;

    switch (event.type) {
      case 'payment_intent.succeeded':
        return await paymentRepository.updateStatus(paymentIntent.id, 'succeeded', {
          paymentMethod: paymentIntent.payment_method,
        });

      case 'payment_intent.payment_failed':
        return await paymentRepository.updateStatus(paymentIntent.id, 'failed', {
          errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
        });

      case 'payment_intent.canceled':
        return await paymentRepository.updateStatus(paymentIntent.id, 'canceled');

      case 'payment_intent.processing':
        return await paymentRepository.updateStatus(paymentIntent.id, 'processing');

      case 'charge.refunded':
        const charge = event.data.object;
        // The charge has a payment_intent field we can use to find the payment
        if (charge.payment_intent) {
          return await paymentRepository.addRefund(
            charge.payment_intent,
            charge.refunds.data[0]?.id,
            charge.amount_refunded / 100
          );
        }
        return null;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
        return null;
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
};

/**
 * Get payment statistics for a user
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 * @returns {Promise<Array>} Payment statistics
 */
const getPaymentStats = async (userId, startDate = null, endDate = null) => {
  try {
    return await paymentRepository.getPaymentStats(userId, startDate, endDate);
  } catch (error) {
    console.error('Error getting payment stats:', error);
    throw error;
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
