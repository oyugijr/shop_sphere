const { redisSub } = require("../config/redisConfig");
const { sendEmail, sendSMS, sendWhatsApp } = require("../utils/brevoService");

// Subscribe to the "notifications" channel
redisSub.subscribe("notifications", (err) => {
  if (err) console.error("Failed to subscribe:", err);
  else console.log("Subscribed to Redis notifications channel");
});

// Listen for new events
redisSub.on("message", async (channel, message) => {
  if (channel === "notifications") {
    const { userId, type, contact, message } = JSON.parse(message);

    try {
      if (type === "email") await sendEmail(contact, "New Notification", message);
      if (type === "sms") await sendSMS(contact, message);
      if (type === "whatsapp") await sendWhatsApp(contact, message);
      console.log(`Notification sent via ${type} to ${contact}`);
    } catch (error) {
      console.error("Error sending notification:", error.message);
    }
  }
});


// const sendEmail = require("../utils/sendEmail");
// const sendSMS = require("../utils/sendSMS");
// const sendWhatsApp = require("../utils/sendWhatsApp");

// const processEmail = async (job) => {
//   await sendEmail(job.data.userId, job.data.message);
// };

// const processSMS = async (job) => {
//   await sendSMS(job.data.userId, job.data.message);
// };

// const processWhatsApp = async (job) => {
//   await sendWhatsApp(job.data.userId, job.data.message);
// };

// module.exports = { processEmail, processSMS, processWhatsApp };
