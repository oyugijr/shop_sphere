const Notification = require("../models/Notification");

const createNotification = async (data) => {
  return await Notification.create(data);
};

const getUserNotifications = async (userId) => {
  return await Notification.find({ userId }).sort({ createdAt: -1 });
};

const markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
};

module.exports = { createNotification, getUserNotifications, markAsRead };
