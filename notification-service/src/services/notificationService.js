const notificationRepository = require("../repositories/notificationRepository");
const queue = require("../config/queue");

const sendNotification = async (userId, type, message) => {
  const notification = await notificationRepository.createNotification({ userId, type, message });

  if (type === "email") queue.add("sendEmail", { userId, message });
  if (type === "sms") queue.add("sendSMS", { userId, message });
  if (type === "whatsapp") queue.add("sendWhatsApp", { userId, message });

  // queue.add("sendEmail", { userId, message });
  return notification;
};

const getUserNotifications = async (userId) => {
  return await notificationRepository.getUserNotifications(userId);
};

const markNotificationAsRead = async (id) => {
  return await notificationRepository.markAsRead(id);
};

module.exports = { sendNotification, getUserNotifications, markNotificationAsRead };

