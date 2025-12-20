const Payment = require("../models/Payment");

const create = async (paymentData) => {
  return await Payment.create(paymentData);
};

const findByStripeId = async (stripePaymentIntentId) => {
  return await Payment.findOne({ stripePaymentIntentId });
};

const findByOrderId = async (orderId) => {
  return await Payment.findOne({ orderId }).sort({ createdAt: -1 });
};

const findByUserId = async (userId, limit = 50) => {
  return await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const updateStatus = async (stripePaymentIntentId, status, additionalData = {}) => {
  return await Payment.findOneAndUpdate(
    { stripePaymentIntentId },
    { status, ...additionalData },
    { new: true }
  );
};

const updatePaymentMethod = async (stripePaymentIntentId, paymentMethod) => {
  return await Payment.findOneAndUpdate(
    { stripePaymentIntentId },
    { paymentMethod },
    { new: true }
  );
};

const addRefund = async (stripePaymentIntentId, refundId, refundAmount) => {
  return await Payment.findOneAndUpdate(
    { stripePaymentIntentId },
    {
      status: 'refunded',
      refundId,
      refundAmount,
    },
    { new: true }
  );
};

const getPaymentStats = async (userId, startDate, endDate) => {
  const match = { userId };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  return await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);
};

module.exports = {
  create,
  findByStripeId,
  findByOrderId,
  findByUserId,
  updateStatus,
  updatePaymentMethod,
  addRefund,
  getPaymentStats,
};
