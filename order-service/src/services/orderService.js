const orderRepository = require("../repositories/orderRepository");

const createOrder = async (userId, products, totalPrice) => {
  return await orderRepository.createOrder({ user: userId, products, totalPrice });
};

const getOrderById = async (orderId) => {
  return await orderRepository.getOrderById(orderId);
};

const getUserOrders = async (userId) => {
  return await orderRepository.getUserOrders(userId);
};

const updateOrderStatus = async (orderId, status) => {
  return await orderRepository.updateOrderStatus(orderId, status);
};

module.exports = { createOrder, getOrderById, getUserOrders, updateOrderStatus };
