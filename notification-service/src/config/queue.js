// const Queue = require("bull");

// const notificationQueue = new Queue("notificationQueue");

// notificationQueue.process("sendEmail", async (job) => {
//   const { userId, message } = job.data;
//   console.log(`Sending email to user: ${userId} - Message: ${message}`);
//   // Call email service
// });

// module.exports = notificationQueue;

const Queue = require("bull");
const emailWorker = require("../workers/notificationWorker");

const notificationQueue = new Queue("notifications");

notificationQueue.process("sendEmail", emailWorker.processEmail);
console.log("Processing email job");

notificationQueue.process("sendSMS", emailWorker.processSMS);
console.log("Processing SMS job");

notificationQueue.process("sendWhatsApp", emailWorker.processWhatsApp);
console.log("Processing WhatsApp job");

module.exports = notificationQueue;
