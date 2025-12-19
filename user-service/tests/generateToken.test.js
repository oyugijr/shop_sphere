const jwt = require('jsonwebtoken');
const generateToken = require('../../src/utils/generateToken');

describe('generateToken Utility', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  it('should generate a valid JWT token', () => {
    const result = generateToken(mockUser);
    
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
    expect(typeof result.token).toBe('string');
  });

  it('should include user data in response', () => {
    const result = generateToken(mockUser);
    
    expect(result.user).toEqual({
      id: mockUser._id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role
    });
  });

  it('should create a token with correct payload', () => {
    const result = generateToken(mockUser);
    const decoded = jwt.verify(result.token, 'test_secret');
    
    expect(decoded.userId).toBe(mockUser._id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(mockUser.role);
  });

  it('should set token expiration', () => {
    const result = generateToken(mockUser);
    const decoded = jwt.verify(result.token, 'test_secret');
    
    expect(decoded).toHaveProperty('exp');
    expect(decoded).toHaveProperty('iat');
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it('should handle admin role', () => {
    const adminUser = { ...mockUser, role: 'admin' };
    const result = generateToken(adminUser);
    const decoded = jwt.verify(result.token, 'test_secret');
    
    expect(decoded.role).toBe('admin');
    expect(result.user.role).toBe('admin');
  });
});
