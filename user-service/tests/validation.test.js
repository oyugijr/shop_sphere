const {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateUserRegistration,
  validateUserUpdate
} = require('../../src/utils/validation');

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', () => {
      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('123456')).toBe(true);
    });

    it('should return false for invalid password', () => {
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags and dangerous content', () => {
      expect(sanitizeInput('<script>alert("xss")</script>test')).toBe('scriptalert("xss")/scripttest');
      expect(sanitizeInput('javascript:void(0)')).toBe('void(0)');
      expect(sanitizeInput('data:text/html,<script>alert(1)</script>')).toBe('text/html,scriptalert(1)/script');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('onmouseover=alert(1)')).toBe('alert(1)');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeInput('<div>test</div>')).toBe('divtest/div');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should return non-string input as is', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });
  });

  describe('validateUserRegistration', () => {
    it('should validate correct user registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      const result = validateUserRegistration(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid name', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'password123'
      };
      const result = validateUserRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters long');
    });

    it('should return errors for invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };
      const result = validateUserRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email is required');
    });

    it('should return errors for invalid password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345'
      };
      const result = validateUserRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 6 characters long');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidData = {
        name: 'J',
        email: 'invalid',
        password: '123'
      };
      const result = validateUserRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateUserUpdate', () => {
    it('should validate correct user update data', () => {
      const validData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };
      const result = validateUserUpdate(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow partial updates', () => {
      const validData = {
        name: 'Jane Doe'
      };
      const result = validateUserUpdate(validData);
      expect(result.isValid).toBe(true);
    });

    it('should return errors for invalid name', () => {
      const invalidData = {
        name: 'J'
      };
      const result = validateUserUpdate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters long');
    });

    it('should return errors for invalid email', () => {
      const invalidData = {
        email: 'invalid-email'
      };
      const result = validateUserUpdate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email is required');
    });
  });
});
