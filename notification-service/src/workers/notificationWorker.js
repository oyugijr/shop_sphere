// const notificationRepository = require("../repositories/notificationRepository");
// const notificationService = require("../services/notificationService");

// const notificationWorker = async (job) => {
//   const notifications = await notificationRepository.getPendingNotifications();
//   for (const notification of notifications) {
//     await notificationService.processNotification(notification);
//   }
// };

// module.exports = notificationWorker;

const queue = require("../config/queue");

queue.process(async (job) => {
  console.log("Processing job:", job.data);
});
