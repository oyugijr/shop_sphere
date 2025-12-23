const orderService = require("../services/orderService");
const { validateOrderStatus, validatePaymentStatus } = require("../utils/validations");

const createOrder = async (req, res, next) => {
  try {
    // const { products, totalPrice } = req.body;
    // const order = await orderService.createOrder(req.user.id, products, totalPrice);
    // res.status(201).json(order);
    const token = req.header("Authorization");
    const order = await orderService.createOrder(req.user.id, req.body, token);

    console.log(`Order created: ${order.orderNumber} by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error', error);
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const order = await orderService.getOrderById(req.params.id, req.user.id, isAdmin);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error', error);
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await orderService.getUserOrders(req.user.id, options);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    if (!validateOrderStatus(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: pending, processing, shipped, delivered, cancelled'
      });
    }

    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      req.user.id,
      note
    );

    console.log(`Order ${order.orderNumber} status updated to ${status} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, paymentId, paymentMethod } = req.body;

    if (!validatePaymentStatus(paymentStatus)) {
      return res.status(400).json({
        error: 'Invalid payment status',
        message: 'Payment status must be one of: pending, processing, completed, failed, refunded'
      });
    }

    const order = await orderService.updateOrderPaymentStatus(
      req.params.id,
      paymentStatus,
      paymentId,
      paymentMethod
    );

    console.log(`Order ${order.orderNumber} payment status updated to ${paymentStatus}`);

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        error: 'Cancellation reason is required'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const order = await orderService.cancelOrder(
      req.params.id,
      req.user.id,
      isAdmin,
      reason
    );

    console.log(`Order ${order.orderNumber} cancelled by user: ${req.user.id}, reason: ${reason}`);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const getOrderByOrderNumber = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const order = await orderService.getOrderByOrderNumber(
      req.params.orderNumber,
      req.user.id,
      isAdmin
    );

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const getOrderStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const stats = await orderService.getOrderStats(req.user.id, isAdmin);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderByOrderNumber,
  getOrderStats
};
