const authController = require('../../src/controllers/authController');
const authService = require('../../src/services/authService');

jest.mock('../../src/services/authService');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      const mockResponse = {
        token: 'mock_token',
        user: { id: '123', name: 'John Doe', email: 'john@example.com', role: 'user' }
      };

      req.body = userData;
      authService.registerUser.mockResolvedValue(mockResponse);

      await authController.register(req, res);

      expect(authService.registerUser).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle registration errors', async () => {
      req.body = { email: 'test@test.com' };
      authService.registerUser.mockRejectedValue(new Error('User already exists'));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };
      const mockResponse = {
        token: 'mock_token',
        user: { id: '123', name: 'John Doe', email: 'john@example.com', role: 'user' }
      };

      req.body = loginData;
      authService.loginUser.mockResolvedValue(mockResponse);

      await authController.login(req, res);

      expect(authService.loginUser).toHaveBeenCalledWith(loginData.email, loginData.password);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle login errors', async () => {
      req.body = { email: 'test@test.com', password: 'wrong' };
      authService.loginUser.mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      };

      req.user = { userId: '123' };
      authService.getUserProfile.mockResolvedValue(mockUser);

      await authController.getProfile(req, res);

      expect(authService.getUserProfile).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle profile retrieval errors', async () => {
      req.user = { userId: '123' };
      authService.getUserProfile.mockRejectedValue(new Error('User not found'));

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });
});
