const notificationController = require('../../../src/controllers/notificationController');
const notificationService = require('../../../src/services/notificationService');

jest.mock('../../../src/services/notificationService');

describe('Notification Controller', () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: '507f1f77bcf86cd799439011' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('sendNotification', () => {
    it('should send a notification', async () => {
      const notificationData = {
        type: 'email',
        contact: 'user@example.com',
        message: 'Test notification'
      };
      const mockNotification = {
        _id: 'notif1',
        userId: req.user.id,
        type: notificationData.type,
        message: notificationData.message,
        status: 'pending'
      };

      req.body = notificationData;
      notificationService.sendNotification.mockResolvedValue(mockNotification);

      await notificationController.sendNotification(req, res);

      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        req.user.id,
        notificationData.type,
        notificationData.contact,
        notificationData.message
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNotification);
    });

    it('should handle errors', async () => {
      req.body = { type: 'email', contact: 'test@test.com', message: 'Test' };
      const error = new Error('Service error');
      notificationService.sendNotification.mockRejectedValue(error);

      await notificationController.sendNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to send notification',
        details: 'Service error'
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user', async () => {
      const mockNotifications = [
        { _id: 'notif1', userId: req.user.id, type: 'email', message: 'Message 1', status: 'sent' },
        { _id: 'notif2', userId: req.user.id, type: 'sms', message: 'Message 2', status: 'pending' }
      ];

      notificationService.getUserNotifications.mockResolvedValue(mockNotifications);

      await notificationController.getUserNotifications(req, res);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(req.user.id);
      expect(res.json).toHaveBeenCalledWith(mockNotifications);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      notificationService.getUserNotifications.mockRejectedValue(error);

      await notificationController.getUserNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch notifications',
        details: 'Database error'
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        _id: 'notif1',
        userId: req.user.id,
        type: 'email',
        message: 'Test',
        status: 'read'
      };

      req.params.id = 'notif1';
      notificationService.markNotificationAsRead.mockResolvedValue(mockNotification);

      await notificationController.markAsRead(req, res);

      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith('notif1');
      expect(res.json).toHaveBeenCalledWith(mockNotification);
    });

    it('should return 404 if notification not found', async () => {
      req.params.id = 'nonexistent';
      notificationService.markNotificationAsRead.mockResolvedValue(null);

      await notificationController.markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });

    it('should handle errors', async () => {
      req.params.id = 'notif1';
      const error = new Error('Database error');
      notificationService.markNotificationAsRead.mockRejectedValue(error);

      await notificationController.markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to mark notification as read',
        details: 'Database error'
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
