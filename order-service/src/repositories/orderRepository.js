const Order = require("../models/Order");

const createOrder = async (orderData) => {
  return await Order.create(orderData);
};

const getOrderById = async (orderId) => {
  return await Order.findById(orderId).populate("user").populate("products.product");
};

const getUserOrders = async (userId) => {
  return await Order.find({ user: userId }).populate("products.product");
};

const updateOrderStatus = async (orderId, status) => {
  return await Order.findByIdAndUpdate(orderId, { status }, { new: true });
};

module.exports = { createOrder, getOrderById, getUserOrders, updateOrderStatus };
