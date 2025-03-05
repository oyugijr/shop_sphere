const express = require("express");
const { createNotification, getUserNotifications, markNotificationAsRead } = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/send", authMiddleware, createNotification);
router.get("/:userId", authMiddleware, getUserNotifications);
router.patch("/:id/read", authMiddleware, markNotificationAsRead);

module.exports = router;
