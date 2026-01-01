const mpesaClient = require('../config/mpesa');
const paymentRepository = require('../repositories/paymentRepository');

/**
 * Validate Kenyan phone number format
 */
const validatePhoneNumber = (phoneNumber) => {
  // Remove any spaces or dashes
  const cleaned = phoneNumber.replace(/[\s-]/g, '');
  
  // Accept formats: 254XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '254' + cleaned;
  }
  
  throw new Error('Invalid phone number format. Use 254XXXXXXXXX, 0XXXXXXXXX, or XXXXXXXXX');
};

/**
 * Initiate M-Pesa payment
 * @param {string} orderId - Order ID
 * @param {number} amount - Amount in KES (Kenyan Shillings)
 * @param {string} phoneNumber - Customer phone number
 * @param {string} userId - User ID
 * @param {object} metadata - Additional metadata
 */
const initiateMpesaPayment = async (orderId, amount, phoneNumber, userId, metadata = {}) => {
  try {
    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (!phoneNumber) {
      throw new Error('Phone number is required for M-Pesa payments');
    }

    // Validate and format phone number
    const formattedPhone = validatePhoneNumber(phoneNumber);

    // Initiate STK Push
    const mpesaResponse = await mpesaClient.stkPush(
      formattedPhone,
      amount,
      orderId,
      `Payment for order ${orderId}`
    );

    // Check if STK Push was successful
    if (mpesaResponse.ResponseCode !== '0') {
      throw new Error(mpesaResponse.ResponseDescription || 'M-Pesa payment initiation failed');
    }

    // Store payment record in database
    const payment = await paymentRepository.create({
      orderId,
      userId,
      provider: 'mpesa',
      mpesaCheckoutRequestId: mpesaResponse.CheckoutRequestID,
      phoneNumber: formattedPhone,
      amount: amount,
      currency: 'kes',
      status: 'pending',
      metadata,
    });

    return {
      checkoutRequestId: mpesaResponse.CheckoutRequestID,
      merchantRequestId: mpesaResponse.MerchantRequestID,
      responseCode: mpesaResponse.ResponseCode,
      responseDescription: mpesaResponse.ResponseDescription,
      customerMessage: mpesaResponse.CustomerMessage,
      payment,
    };
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    throw error;
  }
};

/**
 * Query M-Pesa payment status
 * @param {string} checkoutRequestId - M-Pesa CheckoutRequestID
 */
const queryMpesaPayment = async (checkoutRequestId) => {
  try {
    // Query M-Pesa API
    const mpesaResponse = await mpesaClient.stkPushQuery(checkoutRequestId);

    // Find payment in database
    const payment = await paymentRepository.findByMpesaCheckoutId(checkoutRequestId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Update payment status based on M-Pesa response
    let status = payment.status;
    let updateData = {};

    if (mpesaResponse.ResultCode === '0') {
      // Payment successful
      status = 'succeeded';
      updateData = {
        mpesaTransactionId: mpesaResponse.CheckoutRequestID,
        paymentMethod: 'mpesa',
      };
    } else if (mpesaResponse.ResultCode) {
      // Payment failed or cancelled
      status = mpesaResponse.ResultCode === '1032' ? 'canceled' : 'failed';
      updateData = {
        errorMessage: mpesaResponse.ResultDesc || 'Payment failed',
      };
    }

    // Update payment in database if status changed
    if (status !== payment.status) {
      const updatedPayment = await paymentRepository.updateByCheckoutId(
        checkoutRequestId,
        status,
        updateData
      );
      return updatedPayment;
    }

    return payment;
  } catch (error) {
    console.error('Error querying M-Pesa payment:', error);
    throw error;
  }
};

/**
 * Handle M-Pesa callback
 * @param {object} callbackData - M-Pesa callback data
 */
const handleMpesaCallback = async (callbackData) => {
  try {
    const { Body } = callbackData;
    const { stkCallback } = Body;

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Find payment by CheckoutRequestID
    const payment = await paymentRepository.findByMpesaCheckoutId(CheckoutRequestID);

    if (!payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return null;
    }

    let status;
    let updateData = {};

    if (ResultCode === 0) {
      // Payment successful
      status = 'succeeded';

      // Extract transaction details from callback metadata
      if (CallbackMetadata && CallbackMetadata.Item) {
        const metadataItems = {};
        CallbackMetadata.Item.forEach(item => {
          metadataItems[item.Name] = item.Value;
        });

        updateData = {
          mpesaTransactionId: metadataItems.MpesaReceiptNumber,
          mpesaReceiptNumber: metadataItems.MpesaReceiptNumber,
          paymentMethod: 'mpesa',
          phoneNumber: metadataItems.PhoneNumber,
        };
      }
    } else {
      // Payment failed or cancelled
      status = ResultCode === 1032 ? 'canceled' : 'failed';
      updateData = {
        errorMessage: ResultDesc || 'Payment failed',
      };
    }

    // Update payment in database
    const updatedPayment = await paymentRepository.updateByCheckoutId(
      CheckoutRequestID,
      status,
      updateData
    );

    return updatedPayment;
  } catch (error) {
    console.error('Error handling M-Pesa callback:', error);
    throw error;
  }
};

/**
 * Process M-Pesa refund
 * @param {string} checkoutRequestId - M-Pesa CheckoutRequestID
 * @param {number} amount - Amount to refund (optional, defaults to full refund)
 */
const refundMpesaPayment = async (checkoutRequestId, amount = null) => {
  try {
    // Find payment
    const payment = await paymentRepository.findByMpesaCheckoutId(checkoutRequestId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund successful payments');
    }

    // Determine refund amount
    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    // Initiate B2C refund
    const b2cResponse = await mpesaClient.b2cPayment(
      payment.phoneNumber,
      refundAmount,
      `Refund for transaction ${payment.mpesaReceiptNumber || checkoutRequestId}`
    );

    if (b2cResponse.ResponseCode !== '0') {
      throw new Error(b2cResponse.ResponseDescription || 'Refund initiation failed');
    }

    // Update payment in database
    const updatedPayment = await paymentRepository.updateByCheckoutId(
      checkoutRequestId,
      'refunded',
      {
        refundId: b2cResponse.ConversationID,
        refundAmount: refundAmount,
      }
    );

    return updatedPayment;
  } catch (error) {
    console.error('Error processing M-Pesa refund:', error);
    throw error;
  }
};

/**
 * Get payment by order ID
 */
const getMpesaPaymentByOrderId = async (orderId) => {
  try {
    return await paymentRepository.findByOrderId(orderId, 'mpesa');
  } catch (error) {
    console.error('Error getting M-Pesa payment:', error);
    throw error;
  }
};

module.exports = {
  initiateMpesaPayment,
  queryMpesaPayment,
  handleMpesaCallback,
  refundMpesaPayment,
  getMpesaPaymentByOrderId,
  validatePhoneNumber,
};
