const userService = require('../../../src/services/userService');
const userRepository = require('../../../src/repositories/userRepository');

jest.mock('../../../src/repositories/userRepository');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    };

    it('should get user by id successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById('507f1f77bcf86cd799439011');

      expect(userRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserById('nonexistent');

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      userRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserById('507f1f77bcf86cd799439011')).rejects.toThrow('Database error');
    });
  });
});
