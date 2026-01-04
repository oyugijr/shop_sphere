const Queue = require('bull');
require('dotenv').config();

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = process.env.REDIS_PORT || 6379;

console.log(`[Queue] Initializing Bull queue with Redis at ${redisHost}:${redisPort}...`);

// Create a Bull queue for processing notifications
const notificationQueue = new Queue('notifications', {
  redis: {
    host: redisHost,
    port: redisPort,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs for debugging
    removeOnFail: false, // Keep failed jobs for analysis
  },
  settings: {
    lockDuration: 30000, // 30 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Max times a job can be recovered from stalled state
  }
});

// Queue event listeners for monitoring and debugging
notificationQueue.on('completed', (job, result) => {
  console.log(`[Queue] ✓ Job ${job.id} completed successfully`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`[Queue] ✗ Job ${job.id} failed after attempt ${job.attemptsMade}/${job.opts.attempts}:`, err.message);
});

notificationQueue.on('error', (error) => {
  console.error('[Queue] Queue error:', error.message);
});

notificationQueue.on('waiting', (jobId) => {
  console.log(`[Queue] Job ${jobId} is waiting`);
});

notificationQueue.on('active', (job) => {
  console.log(`[Queue] Job ${job.id} is now active`);
});

notificationQueue.on('stalled', (job) => {
  console.warn(`[Queue] ⚠️  Job ${job.id} has stalled`);
});

notificationQueue.on('progress', (job, progress) => {
  console.log(`[Queue] Job ${job.id} progress: ${progress}%`);
});

notificationQueue.on('paused', () => {
  console.log('[Queue] Queue has been paused');
});

notificationQueue.on('resumed', () => {
  console.log('[Queue] Queue has been resumed');
});

notificationQueue.on('cleaned', (jobs, type) => {
  console.log(`[Queue] Cleaned ${jobs.length} ${type} jobs`);
});

// Health check method
notificationQueue.getHealthStatus = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      notificationQueue.getWaitingCount(),
      notificationQueue.getActiveCount(),
      notificationQueue.getCompletedCount(),
      notificationQueue.getFailedCount(),
      notificationQueue.getDelayedCount(),
    ]);

    return {
      status: 'healthy',
      queue: 'notifications',
      jobs: {
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Queue] Health check failed:', error.message);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Graceful shutdown
const closeQueue = async () => {
  console.log('[Queue] Closing notification queue...');
  await notificationQueue.close();
  console.log('[Queue] ✓ Notification queue closed');
};

process.on('SIGTERM', closeQueue);
process.on('SIGINT', closeQueue);

console.log('[Queue] ✓ Notification queue initialized');

module.exports = notificationQueue;
