const express = require("express");
const { 
  createOrder, 
  getOrderById, 
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderByOrderNumber,
  getOrderStats
} = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// User routes
router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getUserOrders);
router.get("/stats", authMiddleware, getOrderStats);
router.get("/order-number/:orderNumber", authMiddleware, getOrderByOrderNumber);
router.get("/:id", authMiddleware, getOrderById);
router.post("/:id/cancel", authMiddleware, cancelOrder);

// Admin routes
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllOrders);
router.put("/:id/status", authMiddleware, roleMiddleware(["admin"]), updateOrderStatus);
router.put("/:id/payment-status", authMiddleware, roleMiddleware(["admin"]), updatePaymentStatus);

module.exports = router;
