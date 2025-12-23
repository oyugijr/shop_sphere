const orderRepository = require("../repositories/orderRepository");
const { validateOrder, sanitizeInput } = require("../utils/validation");
const { verifyProductStock } = require("../utils/serviceClients");

const createOrder = async (userId, orderData, token) => {
  // Validate order data
  const validation = validateOrder(orderData);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(', '));
    error.statusCode = 400;
    throw error;
  }

  // Sanitize shipping address
  const shippingAddress = {
    fullName: sanitizeInput(orderData.shippingAddress.fullName),
    phoneNumber: sanitizeInput(orderData.shippingAddress.phoneNumber),
    street: sanitizeInput(orderData.shippingAddress.street),
    city: sanitizeInput(orderData.shippingAddress.city),
    state: sanitizeInput(orderData.shippingAddress.state),
    zipCode: sanitizeInput(orderData.shippingAddress.zipCode),
    country: sanitizeInput(orderData.shippingAddress.country)
  };

  // Verify product stock availability
  try {
    const products = await verifyProductStock(orderData.items, token);
    
    // Prepare order items with product details
    const items = orderData.items.map((item, index) => {
      const product = products[index];
      const subtotal = item.quantity * item.price;
      
      return {
        product: item.productId || item.product,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        subtotal
      };
    });

    // Create order
    const order = await orderRepository.createOrder({
      user: userId,
      items,
      totalPrice: orderData.totalPrice,
      shippingAddress,
      notes: orderData.notes ? sanitizeInput(orderData.notes) : undefined,
      paymentMethod: orderData.paymentMethod
    });

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

const getOrderById = async (orderId, userId, isAdmin) => {
  const order = await orderRepository.getOrderById(orderId);
  
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Check authorization - users can only view their own orders
  if (!isAdmin && order.user._id.toString() !== userId.toString()) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

const getUserOrders = async (userId, options) => {
  return await orderRepository.getUserOrders(userId, options);
};

const getAllOrders = async (options) => {
  return await orderRepository.getAllOrders(options);
};

const updateOrderStatus = async (orderId, status, userId, note) => {
  const order = await orderRepository.updateOrderStatus(orderId, status, userId, note);
  
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return order;
};

const updateOrderPaymentStatus = async (orderId, paymentStatus, paymentId, paymentMethod) => {
  const order = await orderRepository.updateOrderPaymentStatus(
    orderId, 
    paymentStatus, 
    paymentId, 
    paymentMethod
  );
  
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return order;
};

const cancelOrder = async (orderId, userId, isAdmin, reason) => {
  const order = await orderRepository.getOrderById(orderId);
  
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Check authorization - users can only cancel their own orders
  if (!isAdmin && order.user._id.toString() !== userId.toString()) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return await orderRepository.cancelOrder(orderId, userId, reason);
};

const getOrderByOrderNumber = async (orderNumber, userId, isAdmin) => {
  const order = await orderRepository.getOrderByOrderNumber(orderNumber);
  
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Check authorization
  if (!isAdmin && order.user._id.toString() !== userId.toString()) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

const getOrderStats = async (userId, isAdmin) => {
  return await orderRepository.getOrderStats(userId, isAdmin);
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
