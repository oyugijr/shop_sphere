const { redisSub } = require("../config/redisConfig");
const notificationQueue = require("../config/queue");
const { sendEmail, sendSMS, sendWhatsApp } = require("../utils/brevoService");
const notificationRepository = require("../repositories/notificationRepository");

// Subscribe to the "notifications" channel for pub/sub events
redisSub.subscribe("notifications", (err) => {
  if (err) {
    console.error("Failed to subscribe to Redis notifications channel:", err);
  } else {
    console.log("✓ Subscribed to Redis notifications channel");
  }
});

// Listen for new events from Redis pub/sub
redisSub.on("message", async (channel, message) => {
  if (channel === "notifications") {
    try {
      const notificationData = JSON.parse(message);
      const { userId, type, contact, message: content, notificationId } = notificationData;
      
      console.log(`[Worker] Received ${type} notification for user ${userId}`);
      
      // Add job to Bull queue for processing
      await notificationQueue.add({
        userId,
        type,
        contact,
        message: content,
        notificationId,
        timestamp: new Date().toISOString()
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
      
      console.log(`[Worker] Added ${type} notification to queue for processing`);
    } catch (error) {
      console.error("[Worker] Error parsing notification message:", error.message);
    }
  }
});

// Process notification jobs from Bull queue
notificationQueue.process(async (job) => {
  const { userId, type, contact, message: content, notificationId } = job.data;
  
  console.log(`[Queue] Processing job ${job.id} - ${type} notification for ${contact}`);
  
  try {
    let result;
    
    // Send notification based on type
    switch (type) {
      case "email":
        result = await sendEmail(contact, "ShopSphere Notification", content);
        break;
      case "sms":
        result = await sendSMS(contact, content);
        break;
      case "whatsapp":
        result = await sendWhatsApp(contact, content);
        break;
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }
    
    // Update notification status to 'sent' in database
    if (notificationId) {
      await notificationRepository.updateNotificationStatus(notificationId, "sent", result);
    }
    
    console.log(`[Queue] ✓ Successfully sent ${type} notification to ${contact}`);
    
    return {
      success: true,
      type,
      contact,
      result,
      sentAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[Queue] ✗ Failed to send ${type} notification to ${contact}:`, error.message);
    
    // Update notification status to 'failed' in database
    if (notificationId) {
      await notificationRepository.updateNotificationStatus(notificationId, "failed", {
        error: error.message,
        failedAt: new Date().toISOString()
      });
    }
    
    // Rethrow error to trigger retry mechanism
    throw error;
  }
});

// Queue event listeners for monitoring
notificationQueue.on("completed", (job, result) => {
  console.log(`[Queue] Job ${job.id} completed successfully:`, result);
});

notificationQueue.on("failed", (job, err) => {
  console.error(`[Queue] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
  
  // If all retries exhausted, log critical error
  if (job.attemptsMade >= job.opts.attempts) {
    console.error(`[Queue] CRITICAL: Job ${job.id} exhausted all retry attempts`);
  }
});

notificationQueue.on("error", (error) => {
  console.error("[Queue] Queue error:", error);
});

notificationQueue.on("stalled", (job) => {
  console.warn(`[Queue] Job ${job.id} has stalled`);
});

// Graceful shutdown handler
process.on("SIGTERM", async () => {
  console.log("[Worker] SIGTERM received, closing notification queue gracefully...");
  await notificationQueue.close();
  await redisSub.quit();
  console.log("[Worker] Notification queue closed");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Worker] SIGINT received, closing notification queue gracefully...");
  await notificationQueue.close();
  await redisSub.quit();
  console.log("[Worker] Notification queue closed");
  process.exit(0);
});

console.log("[Worker] Notification worker initialized and ready to process jobs");

module.exports = notificationQueue;

