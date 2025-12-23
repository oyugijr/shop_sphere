const express = require("express");
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's cart
router.get("/", getCart);

// Add item to cart
router.post("/items", addToCart);

// Update item quantity
router.put("/items/:productId", updateQuantity);

// Remove item from cart
router.delete("/items/:productId", removeFromCart);

// Clear cart
router.delete("/", clearCart);

module.exports = router;
