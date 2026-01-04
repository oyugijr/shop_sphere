const Redis = require('ioredis');
require("dotenv").config();

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

console.log(`[Redis] Connecting to Redis at ${redisUrl}...`);

// Create Redis clients with retry strategy
const redisOptions = {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`[Redis] Reconnection attempt ${times}, waiting ${delay}ms...`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

const redisPub = new Redis(redisUrl, {
  ...redisOptions,
  connectionName: 'notification-publisher'
});

const redisSub = new Redis(redisUrl, {
  ...redisOptions,
  connectionName: 'notification-subscriber'
});

// Publisher event handlers
redisPub.on('connect', () => {
  console.log('[Redis] ✓ Publisher connected');
});

redisPub.on('ready', () => {
  console.log('[Redis] ✓ Publisher ready');
});

redisPub.on('error', (err) => {
  console.error('[Redis] ✗ Publisher error:', err.message);
});

redisPub.on('close', () => {
  console.log('[Redis] Publisher connection closed');
});

// Subscriber event handlers
redisSub.on('connect', () => {
  console.log('[Redis] ✓ Subscriber connected');
});

redisSub.on('ready', () => {
  console.log('[Redis] ✓ Subscriber ready');
});

redisSub.on('error', (err) => {
  console.error('[Redis] ✗ Subscriber error:', err.message);
});

redisSub.on('close', () => {
  console.log('[Redis] Subscriber connection closed');
});

// Graceful shutdown
const closeRedisConnections = async () => {
  console.log('[Redis] Closing Redis connections...');
  await Promise.all([
    redisPub.quit(),
    redisSub.quit()
  ]);
  console.log('[Redis] ✓ All Redis connections closed');
};

process.on('SIGTERM', closeRedisConnections);
process.on('SIGINT', closeRedisConnections);

module.exports = { redisPub, redisSub, closeRedisConnections };
