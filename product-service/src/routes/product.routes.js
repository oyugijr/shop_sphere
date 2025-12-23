const express = require("express");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  updateStock,
  increaseStock,
  decreaseStock,
  checkStock,
  bulkCreate,
  getStats,
  getCategoryStats
} = require("../controllers/product.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const { strictRateLimiter, lenientRateLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

// Public routes (read-only) with lenient rate limiting
router.get("/", lenientRateLimiter, getProducts);
router.get("/search", lenientRateLimiter, searchProducts);
router.get("/stats", lenientRateLimiter, getStats);
router.get("/stats/categories", lenientRateLimiter, getCategoryStats);
router.get("/category/:category", lenientRateLimiter, getProductsByCategory);
router.get("/:id", lenientRateLimiter, getProduct);
router.get("/:id/stock/check", lenientRateLimiter, checkStock);

// Protected routes (write operations) with strict rate limiting and authentication
router.post("/", authMiddleware, strictRateLimiter, createProduct);
router.post("/bulk", authMiddleware, strictRateLimiter, bulkCreate);
router.put("/:id", authMiddleware, strictRateLimiter, updateProduct);
router.delete("/:id", authMiddleware, strictRateLimiter, deleteProduct);

// Stock management routes
router.patch("/:id/stock", authMiddleware, strictRateLimiter, updateStock);
router.post("/:id/stock/increase", authMiddleware, strictRateLimiter, increaseStock);
router.post("/:id/stock/decrease", authMiddleware, strictRateLimiter, decreaseStock);

module.exports = router;
