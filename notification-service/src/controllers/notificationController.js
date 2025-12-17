const notificationService = require("../services/notificationService");

// Handle sending a notification
const sendNotification = async (req, res) => {
  try {
    const { type, contact, message } = req.body;
    const notification = await notificationService.sendNotification(req.user.id, type, contact, message);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// Fetch user notifications
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markNotificationAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

module.exports = { sendNotification, getUserNotifications, markAsRead };
