// const notificationRepository = require("../repositories/notificationRepository");
// const sendEmail = require("../utils/sendEmail");

// const processNotification = async (notification) => {
//   try {
//     if (notification.type === "email") {
//       await sendEmail(notification.userId, notification.message);
//     }
//     notification.status = "sent";
//     await notification.save();
//   } catch (error) {
//     notification.status = "failed";
//     await notification.save();
//   }
// };

// module.exports = { processNotification };

const notificationRepository = require("../repositories/notificationRepository");
const queue = require("../config/queue");

const sendNotification = async (userId, type, message) => {
  const notification = await notificationRepository.createNotification({ userId, type, message });
  queue.add("sendEmail", { userId, message });
  return notification;
};

const getUserNotifications = async (userId) => {
  return await notificationRepository.getUserNotifications(userId);
};

const markNotificationAsRead = async (id) => {
  return await notificationRepository.markAsRead(id);
};

module.exports = { sendNotification, getUserNotifications, markNotificationAsRead };

