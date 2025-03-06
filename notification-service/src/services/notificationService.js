const notificationRepository = require("../repositories/notificationRepository");
const { sendEmail, sendSMS, sendWhatsApp } = require("../utils/brevoService");


const sendNotification = async (userId, type, contact, message) => {
  const notification = await notificationRepository.createNotification({ userId, type, message });

  try {
    if (type === "email") await sendEmail(contact, "New Notification", message);
    if (type === "sms") await sendSMS(contact, message);
    if (type === "whatsapp") await sendWhatsApp(contact, message);
  } catch (error) {
    console.error("Notification failed:", error.message);
  }

  return notification;
}

const getUserNotifications = async (userId) => {
  return await notificationRepository.getUserNotifications(userId);
};

const markNotificationAsRead = async (id) => {
  return await notificationRepository.markAsRead(id);
};

module.exports = { sendNotification, getUserNotifications, markNotificationAsRead };