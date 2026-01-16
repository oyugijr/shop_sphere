const cartRepository = require("../repositories/cartRepository");
const { validateProduct } = require("../utils/productValidator");
const { calculateSubtotal } = require("../utils/calculations");

/**
 * Get user's cart, create if doesn't exist
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
const getCart = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  let cart = await cartRepository.findByUserId(userId);

  // Create empty cart if none exists
  if (!cart) {
    cart = await cartRepository.create({
      userId,
      items: [],
      totalPrice: 0,
      totalItems: 0,
    });
  }

  return cart;
};

/**
 * Add item to cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add
 * @param {number} price - Product price
 * @param {string} name - Product name
 * @returns {Promise<Object>}
 */
const addToCart = async (userId, productId, quantity) => {
  // Validate inputs
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (!quantity || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  if (!Number.isInteger(quantity)) {
    throw new Error("Quantity must be an integer");
  }

  // Validate product exists and has sufficient stock
  const product = await validateProduct(productId, quantity);

  const canonicalName = typeof product.name === "string" ? product.name.trim() : "";
  if (!canonicalName) {
    throw new Error("Product name is unavailable");
  }

  const canonicalPrice = Number(product.price);
  if (!Number.isFinite(canonicalPrice) || canonicalPrice <= 0) {
    throw new Error("Product price is invalid");
  }

  const normalizedPrice = Math.round(canonicalPrice * 100) / 100;

  // Calculate subtotal
  const subtotal = calculateSubtotal(quantity, normalizedPrice);

  // Add or update item in cart
  const cart = await cartRepository.addOrUpdateItem(userId, {
    productId,
    name: canonicalName,
    price: normalizedPrice,
    quantity,
    subtotal,
  });

  return cart;
};

/**
 * Update item quantity in cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>}
 */
const updateQuantity = async (userId, productId, quantity) => {
  // Validate inputs
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (quantity < 0) {
    throw new Error("Quantity cannot be negative");
  }

  if (!Number.isInteger(quantity)) {
    throw new Error("Quantity must be an integer");
  }

  // If quantity is 0, remove the item
  if (quantity === 0) {
    return await removeFromCart(userId, productId);
  }

  // Validate product has sufficient stock
  await validateProduct(productId, quantity);

  // Update item quantity
  const cart = await cartRepository.updateItemQuantity(userId, productId, quantity);

  if (!cart) {
    throw new Error("Cart or item not found");
  }

  return cart;
};

/**
 * Remove item from cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>}
 */
const removeFromCart = async (userId, productId) => {
  // Validate inputs
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!productId) {
    throw new Error("Product ID is required");
  }

  // Remove item
  const cart = await cartRepository.removeItem(userId, productId);

  if (!cart) {
    throw new Error("Cart not found");
  }

  return cart;
};

/**
 * Clear all items from cart
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
const clearCart = async (userId) => {
  // Validate input
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Clear cart
  const cart = await cartRepository.clearCart(userId);

  if (!cart) {
    throw new Error("Cart not found");
  }

  return cart;
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
};
