const express = require("express");
const { sendNotification, getUserNotifications, markAsRead } = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/send", authMiddleware, sendNotification);
router.get("/:userId", authMiddleware, getUserNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);

module.exports = router;
