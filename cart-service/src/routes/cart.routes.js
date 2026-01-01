const express = require("express");
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const rateLimiter = require("../middlewares/rateLimiter");

const router = express.Router();

// All routes require authentication and rate limiting
router.use(authMiddleware);
router.use(rateLimiter(60000, 100)); // 100 requests per minute per user

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
