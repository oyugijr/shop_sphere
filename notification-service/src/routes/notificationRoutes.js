const express = require("express");
const { sendNotification, getUserNotifications, markAsRead } = require("../controllers/notificationController");
const { 
  sendTemplatedNotification,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendShippingNotification,
  sendPaymentConfirmation
} = require("../controllers/templateNotificationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Basic notification routes
router.post("/send", authMiddleware, sendNotification);
router.get("/:userId", authMiddleware, getUserNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);

// Templated notification routes
router.post("/template/send", authMiddleware, sendTemplatedNotification);
router.post("/template/welcome", authMiddleware, sendWelcomeEmail);
router.post("/template/order-confirmation", authMiddleware, sendOrderConfirmation);
router.post("/template/shipping", authMiddleware, sendShippingNotification);
router.post("/template/payment-confirmation", authMiddleware, sendPaymentConfirmation);

module.exports = router;
