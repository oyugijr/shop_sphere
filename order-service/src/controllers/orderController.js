const orderService = require("../services/orderService");

const createOrder = async (req, res) => {
  try {
    const { products, totalPrice } = req.body;
    const order = await orderService.createOrder(req.user.id, products, totalPrice);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createOrder, getOrderById, getUserOrders, updateOrderStatus };
