const {
  sanitizeInput,
  validateProduct,
  validateProductUpdate
} = require('../../../src/utils/validation');

describe('Product Validation Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>test')).toBe('scriptalert("xss")/scripttest');
    });

    it('should remove dangerous protocols', () => {
      expect(sanitizeInput('javascript:void(0)')).toBe('void(0)');
      expect(sanitizeInput('data:text/html,<script>alert(1)</script>')).toBe('text/html,scriptalert(1)/script');
      expect(sanitizeInput('vbscript:msgbox(1)')).toBe('msgbox(1)');
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

  describe('validateProduct', () => {
    it('should validate correct product data', () => {
      const validProduct = {
        name: 'Laptop',
        description: 'Gaming laptop with high specs',
        price: 999.99,
        category: 'electronics',
        stock: 10
      };

      const result = validateProduct(validProduct);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid name', () => {
      const invalidProduct = {
        name: 'L',
        description: 'Gaming laptop with high specs',
        price: 999.99,
        category: 'electronics',
        stock: 10
      };

      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name must be at least 2 characters long');
    });

    it('should return errors for invalid description', () => {
      const invalidProduct = {
        name: 'Laptop',
        description: 'Short',
        price: 999.99,
        category: 'electronics',
        stock: 10
      };

      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product description must be at least 10 characters long');
    });

    it('should return errors for invalid price', () => {
      const invalidProduct = {
        name: 'Laptop',
        description: 'Gaming laptop with high specs',
        price: -10,
        category: 'electronics',
        stock: 10
      };

      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product price cannot be negative');
    });

    it('should return errors for missing category', () => {
      const invalidProduct = {
        name: 'Laptop',
        description: 'Gaming laptop with high specs',
        price: 999.99,
        category: '',
        stock: 10
      };

      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product category is required and must be a string');
    });

    it('should return errors for invalid stock', () => {
      const invalidProduct = {
        name: 'Laptop',
        description: 'Gaming laptop with high specs',
        price: 999.99,
        category: 'electronics',
        stock: -5
      };

      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Stock quantity cannot be negative');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidProduct = {
        name: 'L',
        description: 'Short',
        price: -10,
        category: '',
        stock: -5
      };

      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateProductUpdate', () => {
    it('should validate correct update data', () => {
      const validUpdate = {
        price: 899.99,
        stock: 15
      };

      const result = validateProductUpdate(validUpdate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow partial updates', () => {
      const validUpdate = {
        price: 799.99
      };

      const result = validateProductUpdate(validUpdate);
      expect(result.isValid).toBe(true);
    });

    it('should return errors for invalid name', () => {
      const invalidUpdate = {
        name: 'L'
      };

      const result = validateProductUpdate(invalidUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name must be at least 2 characters long');
    });

    it('should return errors for invalid description', () => {
      const invalidUpdate = {
        description: 'Short'
      };

      const result = validateProductUpdate(invalidUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product description must be at least 10 characters long');
    });

    it('should return errors for invalid price', () => {
      const invalidUpdate = {
        price: -10
      };

      const result = validateProductUpdate(invalidUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product price cannot be negative');
    });

    it('should return errors for invalid stock', () => {
      const invalidUpdate = {
        stock: -5
      };

      const result = validateProductUpdate(invalidUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Stock quantity cannot be negative');
    });

    it('should allow price of 0', () => {
      const validUpdate = {
        price: 0
      };

      const result = validateProductUpdate(validUpdate);
      expect(result.isValid).toBe(true);
    });

    it('should allow stock of 0', () => {
      const validUpdate = {
        stock: 0
      };

      const result = validateProductUpdate(validUpdate);
      expect(result.isValid).toBe(true);
    });
  });
});
