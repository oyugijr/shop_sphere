const notificationService = require('../../../src/services/notificationService');
const notificationRepository = require('../../../src/repositories/notificationRepository');
const { redisPub } = require('../../../src/config/redisConfig');

jest.mock('../../../src/repositories/notificationRepository');
jest.mock('../../../src/config/redisConfig', () => ({
  redisPub: {
    publish: jest.fn()
  },
  redisSub: {
    subscribe: jest.fn(),
    on: jest.fn()
  }
}));

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should create notification and publish to Redis', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const type = 'email';
      const contact = 'john@example.com';
      const message = 'Test notification';

      const mockNotification = {
        _id: '507f1f77bcf86cd799439012',
        userId,
        type,
        message,
        status: 'pending'
      };

      notificationRepository.createNotification.mockResolvedValue(mockNotification);
      redisPub.publish.mockResolvedValue(1);

      const result = await notificationService.sendNotification(userId, type, contact, message);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        userId,
        type,
        message
      });
      expect(redisPub.publish).toHaveBeenCalledWith(
        'notifications',
        JSON.stringify({ userId, type, contact, message })
      );
      expect(result).toEqual(mockNotification);
    });

    it('should propagate repository errors', async () => {
      notificationRepository.createNotification.mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.sendNotification('userId', 'email', 'test@test.com', 'message')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user', async () => {
      const mockNotifications = [
        {
          _id: '1',
          userId: '507f1f77bcf86cd799439011',
          type: 'email',
          message: 'Notification 1',
          status: 'sent'
        },
        {
          _id: '2',
          userId: '507f1f77bcf86cd799439011',
          type: 'sms',
          message: 'Notification 2',
          status: 'pending'
        }
      ];

      notificationRepository.getUserNotifications.mockResolvedValue(mockNotifications);

      const result = await notificationService.getUserNotifications('507f1f77bcf86cd799439011');

      expect(notificationRepository.getUserNotifications).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if user has no notifications', async () => {
      notificationRepository.getUserNotifications.mockResolvedValue([]);

      const result = await notificationService.getUserNotifications('userId');

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      notificationRepository.getUserNotifications.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.getUserNotifications('userId')).rejects.toThrow('Database error');
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        _id: '507f1f77bcf86cd799439012',
        userId: '507f1f77bcf86cd799439011',
        type: 'email',
        message: 'Test',
        status: 'read'
      };

      notificationRepository.markAsRead.mockResolvedValue(mockNotification);

      const result = await notificationService.markNotificationAsRead('507f1f77bcf86cd799439012');

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(result.status).toBe('read');
    });

    it('should return null if notification not found', async () => {
      notificationRepository.markAsRead.mockResolvedValue(null);

      const result = await notificationService.markNotificationAsRead('nonexistent');

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      notificationRepository.markAsRead.mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.markNotificationAsRead('notificationId')
      ).rejects.toThrow('Database error');
    });
  });
});
