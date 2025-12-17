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
    const { userId, type, contact, message: content } = JSON.parse(message);

    try {
      if (type === "email") await sendEmail(contact, "New Notification", content);
      if (type === "sms") await sendSMS(contact, content);
      if (type === "whatsapp") await sendWhatsApp(contact, content);
      console.log(`Notification sent via ${type} to ${contact}`);
    } catch (error) {
      console.error("Error sending notification:", error.message);
    }
  }
});

