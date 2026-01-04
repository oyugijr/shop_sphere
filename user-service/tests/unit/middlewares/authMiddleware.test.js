const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../src/middlewares/authMiddleware');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  it('should verify valid token and call next', () => {
    const mockToken = 'Bearer valid_token';
    const mockDecoded = {
      userId: '507f1f77bcf86cd799439011',
      email: 'john@example.com',
      role: 'user'
    };

    req.header.mockReturnValue(mockToken);
    jwt.verify.mockReturnValue(mockDecoded);

    authMiddleware(req, res, next);

    expect(req.header).toHaveBeenCalledWith('Authorization');
    expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'test_secret');
    expect(req.user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if no token provided', () => {
    req.header.mockReturnValue(null);

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if token is invalid', () => {
    const mockToken = 'Bearer invalid_token';
    req.header.mockReturnValue(mockToken);
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle token without Bearer prefix', () => {
    const mockToken = 'Bearer token_value';
    const mockDecoded = { userId: '123', email: 'test@example.com', role: 'user' };

    req.header.mockReturnValue(mockToken);
    jwt.verify.mockReturnValue(mockDecoded);

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token_value', 'test_secret');
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if token is expired', () => {
    const mockToken = 'Bearer expired_token';
    req.header.mockReturnValue(mockToken);
    jwt.verify.mockImplementation(() => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
