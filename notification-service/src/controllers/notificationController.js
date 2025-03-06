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
  const notifications = await notificationService.getUserNotifications(req.user.id);
  res.json(notifications);
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(req.params.id);
  res.json(notification);
};

module.exports = { sendNotification, getUserNotifications, markAsRead };


// // const notificationRepository = require("../repositories/notificationRepository");

// // const createNotification = async (req, res) => {
// //   try {
// //     const notification = await notificationRepository.createNotification(req.body);
// //     res.status(201).json(notification);
// //   } catch (error) {
// //     res.status(500).json({ error: "Failed to create notification" });
// //   }
// // };

// // module.exports = { createNotification };

// const notificationService = require("../services/notificationService");

// const createNotification = async (req, res) => {
//   try {
//     const { userId, type, message } = req.body;
//     const notification = await notificationService.sendNotification(userId, type, message);
//     res.status(201).json(notification);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to create notification" });
//   }
// };

// const getUserNotifications = async (req, res) => {
//   try {
//     const notifications = await notificationService.getUserNotifications(req.user.id);
//     res.json(notifications);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch notifications" });
//   }
// };

// const markNotificationAsRead = async (req, res) => {
//   try {
//     const updatedNotification = await notificationService.markNotificationAsRead(req.params.id);
//     res.json(updatedNotification);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to mark notification as read" });
//   }
// };

// module.exports = { createNotification, getUserNotifications, markNotificationAsRead };

