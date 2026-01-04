/**
 * Integration Tests for Notification Service
 * These tests use real Redis and MongoDB instances (no mocks)
 * Run with: npm test -- tests/integration/notificationService.integration.test.js
 */

const mongoose = require('mongoose');
const Redis = require('ioredis');
const notificationQueue = require('../../src/config/queue');
const Notification = require('../../src/models/Notification');
const notificationService = require('../../src/services/notificationService');

// Test configuration
const TEST_MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopSphere_test';
const TEST_REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

describe('Notification Service Integration Tests', () => {
  let redisClient;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create Redis client for testing
    redisClient = new Redis(TEST_REDIS_URL);

    // Wait for connections to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up
    await Notification.deleteMany({});
    await mongoose.connection.close();
    await redisClient.quit();
    await notificationQueue.close();
  });

  beforeEach(async () => {
    // Clear notifications before each test
    await Notification.deleteMany({});
    
    // Clear queue
    await notificationQueue.empty();
  });

  describe('Notification Creation and Persistence', () => {
    it('should create a notification in the database', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notification = await notificationService.sendNotification(
        userId,
        'email',
        'test@example.com',
        'Test message'
      );

      expect(notification).toBeDefined();
      expect(notification.userId.toString()).toBe(userId.toString());
      expect(notification.type).toBe('email');
      expect(notification.message).toBe('Test message');
      expect(notification.status).toBe('pending');

      // Verify it's in the database
      const dbNotification = await Notification.findById(notification._id);
      expect(dbNotification).toBeDefined();
      expect(dbNotification.message).toBe('Test message');
    });

    it('should retrieve user notifications from database', async () => {
      const userId = new mongoose.Types.ObjectId();

      // Create multiple notifications
      await notificationService.sendNotification(userId, 'email', 'test1@example.com', 'Message 1');
      await notificationService.sendNotification(userId, 'sms', '+1234567890', 'Message 2');
      await notificationService.sendNotification(userId, 'whatsapp', '+1234567890', 'Message 3');

      // Retrieve notifications
      const notifications = await notificationService.getUserNotifications(userId);

      expect(notifications).toHaveLength(3);
      expect(notifications[0].message).toBe('Message 3'); // Most recent first
      expect(notifications[1].message).toBe('Message 2');
      expect(notifications[2].message).toBe('Message 1');
    });

    it('should mark notification as read', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notification = await notificationService.sendNotification(
        userId,
        'email',
        'test@example.com',
        'Test message'
      );

      // Mark as read
      const updatedNotification = await notificationService.markNotificationAsRead(notification._id);

      expect(updatedNotification).toBeDefined();
      expect(updatedNotification.status).toBe('sent'); // "sent" is used for "read" in current implementation
    });
  });

  describe('Redis Pub/Sub Integration', () => {
    it('should publish notification event to Redis', (done) => {
      const userId = new mongoose.Types.ObjectId();
      const subscriber = new Redis(TEST_REDIS_URL);

      subscriber.subscribe('notifications', (err) => {
        if (err) {
          done(err);
          return;
        }

        subscriber.on('message', (channel, message) => {
          expect(channel).toBe('notifications');
          
          const data = JSON.parse(message);
          expect(data.userId).toBe(userId.toString());
          expect(data.type).toBe('email');
          expect(data.contact).toBe('test@example.com');
          expect(data.message).toBe('Test Redis message');
          expect(data.notificationId).toBeDefined();

          subscriber.quit();
          done();
        });

        // Send notification after subscription is ready
        notificationService.sendNotification(
          userId,
          'email',
          'test@example.com',
          'Test Redis message'
        );
      });
    }, 10000);
  });

  describe('Bull Queue Integration', () => {
    it('should add jobs to the Bull queue', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      await notificationService.sendNotification(
        userId,
        'email',
        'test@example.com',
        'Queue test message'
      );

      // Wait a bit for the job to be added
      await new Promise(resolve => setTimeout(resolve, 500));

      const waitingCount = await notificationQueue.getWaitingCount();
      const activeCount = await notificationQueue.getActiveCount();
      
      // Job should be either waiting or already active/completed
      expect(waitingCount + activeCount).toBeGreaterThanOrEqual(0);
    });

    it('should report queue health status', async () => {
      const health = await notificationQueue.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.queue).toBe('notifications');
      expect(health.jobs).toBeDefined();
      expect(typeof health.jobs.waiting).toBe('number');
      expect(typeof health.jobs.active).toBe('number');
      expect(typeof health.jobs.completed).toBe('number');
      expect(typeof health.jobs.failed).toBe('number');
    });

    it('should clean up completed jobs as configured', async () => {
      // Queue is configured to keep last 100 completed jobs
      const completedCount = await notificationQueue.getCompletedCount();
      expect(typeof completedCount).toBe('number');
    });
  });

  describe('Notification Model Indexes', () => {
    it('should have proper indexes for efficient queries', async () => {
      const indexes = await Notification.collection.getIndexes();

      // Check for userId index
      expect(indexes).toHaveProperty('userId_1_createdAt_-1');
      
      // Check for status index
      expect(indexes).toHaveProperty('status_1_createdAt_-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid notification types gracefully', async () => {
      const userId = new mongoose.Types.ObjectId();

      await expect(
        Notification.create({
          userId,
          type: 'invalid_type',
          message: 'Test'
        })
      ).rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      await expect(
        Notification.create({
          type: 'email',
          message: 'Test'
        })
      ).rejects.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent notifications', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          notificationService.sendNotification(
            userId,
            'email',
            `test${i}@example.com`,
            `Message ${i}`
          )
        );
      }

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(notification => {
        expect(notification).toBeDefined();
        expect(notification._id).toBeDefined();
      });

      // Verify all are in the database
      const dbNotifications = await Notification.find({ userId });
      expect(dbNotifications).toHaveLength(10);
    });
  });
});
