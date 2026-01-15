const mongoose = require("mongoose");
const Order = require("../models/Order");

const createOrder = async (orderData) => {
  return await Order.create(orderData);
};

const getOrderById = async (orderId) => {
  return await Order.findById(orderId);
};

const getUserOrders = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const skip = (page - 1) * limit;
  const query = { user: userId };

  if (status) {
    query.status = status;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getAllOrders = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const skip = (page - 1) * limit;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const updateOrderStatus = async (orderId, status, userId, note) => {
  const order = await Order.findById(orderId);

  if (!order) {
    return null;
  }

  order.status = status;
  order.addStatusHistory(status, note, userId);

  return await order.save();
};

const updateOrderPaymentStatus = async (orderId, paymentStatus, paymentId, paymentMethod) => {
  const updateData = { paymentStatus };

  if (paymentId) {
    updateData.paymentId = paymentId;
  }

  if (paymentMethod) {
    updateData.paymentMethod = paymentMethod;
  }

  return await Order.findByIdAndUpdate(
    orderId,
    updateData,
    { new: true }
  );
};

const cancelOrder = async (orderId, userId, reason) => {
  const order = await Order.findById(orderId);

  if (!order) {
    return null;
  }

  if (!order.canBeCancelled()) {
    throw new Error('Order cannot be cancelled in current status');
  }

  order.status = 'cancelled';
  order.cancelReason = reason;
  order.cancelledAt = new Date();
  order.cancelledBy = userId;
  order.addStatusHistory('cancelled', reason, userId);

  return await order.save();
};

const getOrderByOrderNumber = async (orderNumber) => {
  return await Order.findOne({ orderNumber });
};

const normalizeObjectId = (value) => {
  if (!value) {
    return value;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return value;
};

const getOrderStats = async (userId, isAdmin) => {
  const query = isAdmin ? {} : { user: normalizeObjectId(userId) };

  const stats = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
        },
        processingOrders: {
          $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] }
        },
        shippedOrders: {
          $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0
  };
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  cancelOrder,
  getOrderByOrderNumber,
  getOrderStats
};