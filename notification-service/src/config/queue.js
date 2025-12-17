const Queue = require('bull');
require('dotenv').config();

// Create a Bull queue for processing notifications
const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  }
});

// Queue event listeners
notificationQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

notificationQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

module.exports = notificationQueue;
