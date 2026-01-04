const Notification = require("../models/Notification");

// create a new notification entry in the database
const createNotification = async ({userId, type, message }) => {
  return await Notification.create({ userId, type, message });
};

// Fetch all notification for  user 
const getUserNotifications = async (userId) => {
  return await Notification.find({ userId }).sort({ createdAt: -1 });
};

// Mark notification as read
const markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(id, { status: "sent" }, { new: true });
};

// Update notification status with additional metadata
const updateNotificationStatus = async (id, status, metadata = {}) => {
  return await Notification.findByIdAndUpdate(
    id,
    { 
      status,
      metadata,
      updatedAt: new Date()
    },
    { new: true }
  );
};

module.exports = { createNotification, getUserNotifications, markAsRead, updateNotificationStatus };
