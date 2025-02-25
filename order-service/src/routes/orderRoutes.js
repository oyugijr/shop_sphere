const express = require("express");
const { createOrder, getOrderById, getUserOrders, updateOrderStatus } = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/:id", authMiddleware, getOrderById);
router.get("/", authMiddleware, getUserOrders);
router.put("/:id/status", authMiddleware, roleMiddleware(["admin"]), updateOrderStatus);

module.exports = router;
