const Cart = require("../models/Cart.model");
const { calculateSubtotal } = require("../utils/calculations");

/**
 * Find cart by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Cart|null>}
 */
const findByUserId = async (userId) => {
  return await Cart.findOne({ userId });
};

/**
 * Create a new cart
 * @param {Object} cartData - Cart data
 * @returns {Promise<Cart>}
 */
const create = async (cartData) => {
  const cart = new Cart(cartData);
  return await cart.save();
};

/**
 * Update cart
 * @param {string} userId - User ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Cart|null>}
 */
const update = async (userId, updateData) => {
  return await Cart.findOneAndUpdate(
    { userId },
    updateData,
    { new: true, runValidators: true }
  );
};

/**
 * Delete cart by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Cart|null>}
 */
const remove = async (userId) => {
  return await Cart.findOneAndDelete({ userId });
};

/**
 * Add or update item in cart
 * @param {string} userId - User ID
 * @param {Object} item - Cart item
 * @returns {Promise<Cart>}
 */
const addOrUpdateItem = async (userId, item) => {
  const cart = await findByUserId(userId);

  if (!cart) {
    // Create new cart with item
    return await create({
      userId,
      items: [item],
    });
  }

  // Check if item already exists
  const existingItemIndex = cart.items.findIndex(
    (i) => i.productId.toString() === item.productId.toString()
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    cart.items[existingItemIndex].quantity += item.quantity;
    cart.items[existingItemIndex].subtotal = calculateSubtotal(
      cart.items[existingItemIndex].quantity,
      cart.items[existingItemIndex].price
    );
  } else {
    // Add new item
    cart.items.push(item);
  }

  return await cart.save();
};

/**
 * Update item quantity in cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Cart|null>}
 */
const updateItemQuantity = async (userId, productId, quantity) => {
  const cart = await findByUserId(userId);

  if (!cart) {
    return null;
  }

  const itemIndex = cart.items.findIndex(
    (i) => i.productId.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    return null;
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    cart.items.splice(itemIndex, 1);
  } else {
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].subtotal = calculateSubtotal(
      cart.items[itemIndex].quantity,
      cart.items[itemIndex].price
    );
  }

  return await cart.save();
};

/**
 * Remove item from cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Cart|null>}
 */
const removeItem = async (userId, productId) => {
  const cart = await findByUserId(userId);

  if (!cart) {
    return null;
  }

  cart.items = cart.items.filter(
    (i) => i.productId.toString() !== productId.toString()
  );

  return await cart.save();
};

/**
 * Clear all items from cart
 * @param {string} userId - User ID
 * @returns {Promise<Cart|null>}
 */
const clearCart = async (userId) => {
  return await update(userId, { items: [] });
};

module.exports = {
  findByUserId,
  create,
  update,
  remove,
  addOrUpdateItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
