const authService = require('../../src/services/authService');
const userRepository = require('../../src/repositories/userRepository');
const generateToken = require('../../src/utils/generateToken');
const bcrypt = require('bcryptjs');

jest.mock('../../src/repositories/userRepository');
jest.mock('../../src/utils/generateToken');
jest.mock('bcryptjs');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const mockUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    const mockCreatedUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    };

    const mockTokenResponse = {
      token: 'mock_jwt_token',
      user: mockCreatedUser
    };

    it('should register a new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(mockCreatedUser);
      generateToken.mockReturnValue(mockTokenResponse);

      const result = await authService.registerUser(mockUserData);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockUserData.email);
      expect(userRepository.createUser).toHaveBeenCalledWith(mockUserData);
      expect(generateToken).toHaveBeenCalledWith(mockCreatedUser);
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw error if user already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockCreatedUser);

      await expect(authService.registerUser(mockUserData)).rejects.toThrow('User already exists');
      expect(userRepository.createUser).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createUser.mockRejectedValue(new Error('Database error'));

      await expect(authService.registerUser(mockUserData)).rejects.toThrow('Database error');
    });
  });

  describe('loginUser', () => {
    const loginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      password: '$2a$10$hashedpassword',
      role: 'user'
    };

    const mockTokenResponse = {
      token: 'mock_jwt_token',
      user: {
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role
      }
    };

    it('should login user with valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue(mockTokenResponse);

      const result = await authService.loginUser(loginData);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw error if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should throw error if password is incorrect', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid credentials');
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should handle bcrypt errors', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      await expect(authService.loginUser(loginData)).rejects.toThrow('Bcrypt error');
    });
  });
});
