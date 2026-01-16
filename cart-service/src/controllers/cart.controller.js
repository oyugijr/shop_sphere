const cartService = require("../services/cartService");

/**
 * Get user's cart
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.getCart(userId);
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ error: error.message || "Failed to get cart" });
  }
};

/**
 * Add item to cart
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    // Validate required fields
    if (!productId || quantity === undefined || quantity === null) {
      return res.status(400).json({
        error: "Missing required fields: productId and quantity are required"
      });
    }

    const cart = await cartService.addToCart(userId, productId, quantity);
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);

    // Handle specific error cases
    if (error.message.includes("not found") || error.message.includes("Insufficient stock")) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes("unavailable")) {
      return res.status(503).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "Failed to add item to cart" });
  }
};

/**
 * Update item quantity in cart
 */
const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate required fields
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: "Quantity is required" });
    }

    const cart = await cartService.updateQuantity(userId, productId, quantity);
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error updating cart quantity:", error);

    // Handle specific error cases
    if (error.message.includes("not found") || error.message.includes("Insufficient stock")) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes("unavailable")) {
      return res.status(503).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "Failed to update cart" });
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await cartService.removeFromCart(userId, productId);
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error removing from cart:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "Failed to remove item from cart" });
  }
};

/**
 * Clear cart
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.clearCart(userId);
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error clearing cart:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "Failed to clear cart" });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
};
