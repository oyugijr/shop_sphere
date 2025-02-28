const Queue = require("bull");

const notificationQueue = new Queue("notificationQueue");

notificationQueue.process("sendEmail", async (job) => {
  const { userId, message } = job.data;
  console.log(`Sending email to user: ${userId} - Message: ${message}`);
  // Call email service
});

module.exports = notificationQueue;
