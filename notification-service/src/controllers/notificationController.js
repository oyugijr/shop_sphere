const notificationService = require("../services/notificationService");

// Handle sending a notification
const sendNotification = async (req, res) => {
  try {
    const { type, contact, message } = req.body;
    const notification = await notificationService.sendNotification(req.user.id, type, contact, message);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification", details: error.message });
  }
};

// Fetch user notifications
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications", details: error.message });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markNotificationAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read", details: error.message });
  }
};

module.exports = { sendNotification, getUserNotifications, markAsRead };
