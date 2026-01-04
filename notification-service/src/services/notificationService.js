const notificationRepository = require("../repositories/notificationRepository");
const { redisPub } = require("../config/redisConfig");

// Publish event instead of directly sending notifications
const sendNotification = async (userId, type, contact, message) => {
  const notification = await notificationRepository.createNotification({ userId, type, message });

  // Publish notification event to Redis with notification ID
  redisPub.publish("notifications", JSON.stringify({ 
    userId, 
    type, 
    contact, 
    message,
    notificationId: notification._id.toString()
  }));

  return notification;
};

const getUserNotifications = async (userId) => {
  return await notificationRepository.getUserNotifications(userId);
};

const markNotificationAsRead = async (id) => {
  return await notificationRepository.markAsRead(id);
};

module.exports = { sendNotification, getUserNotifications, markNotificationAsRead };
