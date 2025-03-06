// const notificationRepository = require("../repositories/notificationRepository");
// const notificationService = require("../services/notificationService");

// const notificationWorker = async (job) => {
//   const notifications = await notificationRepository.getPendingNotifications();
//   for (const notification of notifications) {
//     await notificationService.processNotification(notification);
//   }
// };

// module.exports = notificationWorker;

const sendEmail = require("../utils/sendEmail");
const sendSMS = require("../utils/sendSMS");
const sendWhatsApp = require("../utils/sendWhatsApp");

const processEmail = async (job) => {
  await sendEmail(job.data.userId, job.data.message);
};

const processSMS = async (job) => {
  await sendSMS(job.data.userId, job.data.message);
};

const processWhatsApp = async (job) => {
  await sendWhatsApp(job.data.userId, job.data.message);
};

module.exports = { processEmail, processSMS, processWhatsApp };
