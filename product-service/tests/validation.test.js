/**
 * Unit tests for validation utilities
 */
const {
  sanitizeInput,
  isValidObjectId,
  validateProduct,
  validateProductUpdate,
  validatePagination,
  validateStockOperation
} = require('../src/utils/validation');
const mongoose = require('mongoose');

describe('Validation Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous protocols', () => {
      const input = 'javascript:alert("xss")';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'text onclick=alert("xss")';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('onclick=');
    });

    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Product Name';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should handle arrays', () => {
      const input = ['<script>test</script>', 'normal text'];
      const sanitized = sanitizeInput(input);
      expect(sanitized[0]).not.toContain('<');
      expect(sanitized[1]).toBe('normal text');
    });

    it('should handle objects', () => {
      const input = { name: '<script>test</script>', description: 'normal' };
      const sanitized = sanitizeInput(input);
      expect(sanitized.name).not.toContain('<');
      expect(sanitized.description).toBe('normal');
    });

    it('should handle non-string types', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(true)).toBe(true);
      expect(sanitizeInput(null)).toBe(null);
    });
  });

  describe('isValidObjectId', () => {
    it('should return true for valid ObjectId', () => {
      const validId = new mongoose.Types.ObjectId();
      expect(isValidObjectId(validId.toString())).toBe(true);
    });

    it('should return false for invalid ObjectId', () => {
      expect(isValidObjectId('invalid-id')).toBe(false);
      expect(isValidObjectId('123')).toBe(false);
      expect(isValidObjectId('')).toBe(false);
    });
  });

  describe('validateProduct', () => {
    const validProduct = {
      name: 'Test Product',
      description: 'This is a valid product description',
      price: 99.99,
      stock: 10,
      category: 'electronics'
    };

    it('should validate a valid product', () => {
      const result = validateProduct(validProduct);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing name', () => {
      const invalid = { ...validProduct, name: undefined };
      const result = validateProduct(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should reject short name', () => {
      const invalid = { ...validProduct, name: 'A' };
      const result = validateProduct(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should reject short description', () => {
      const invalid = { ...validProduct, description: 'Short' };
      const result = validateProduct(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('description'))).toBe(true);
    });

    it('should reject negative price', () => {
      const invalid = { ...validProduct, price: -10 };
      const result = validateProduct(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('price'))).toBe(true);
    });

    it('should reject negative stock', () => {
      const invalid = { ...validProduct, stock: -5 };
      const result = validateProduct(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('stock'))).toBe(true);
    });

    it('should reject non-integer stock', () => {
      const invalid = { ...validProduct, stock: 5.5 };
      const result = validateProduct(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('integer'))).toBe(true);
    });

    it('should reject missing category', () => {
      const invalid = { ...validProduct, category: undefined };
      const result = validateProduct(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('category'))).toBe(true);
    });
  });

  describe('validateProductUpdate', () => {
    it('should validate valid update data', () => {
      const result = validateProductUpdate({ price: 150, stock: 20 });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require at least one field', () => {
      const result = validateProductUpdate({});
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('field'))).toBe(true);
    });

    it('should validate name if provided', () => {
      const result = validateProductUpdate({ name: 'A' }); // Too short
      expect(result.isValid).toBe(false);
    });

    it('should validate price if provided', () => {
      const result = validateProductUpdate({ price: -10 }); // Negative
      expect(result.isValid).toBe(false);
    });

    it('should validate stock if provided', () => {
      const result = validateProductUpdate({ stock: -5 }); // Negative
      expect(result.isValid).toBe(false);
    });

    it('should allow partial updates', () => {
      const result = validateProductUpdate({ price: 200 });
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePagination', () => {
    it('should validate valid pagination', () => {
      const result = validatePagination(1, 10);
      expect(result.isValid).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should reject negative page', () => {
      const result = validatePagination(-1, 10);
      expect(result.isValid).toBe(false);
    });

    it('should reject zero page', () => {
      const result = validatePagination(0, 10);
      expect(result.isValid).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = validatePagination(1, 200);
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid page string', () => {
      const result = validatePagination('abc', 10);
      expect(result.isValid).toBe(false);
    });

    it('should parse string numbers', () => {
      const result = validatePagination('2', '20');
      expect(result.isValid).toBe(true);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });
  });

  describe('validateStockOperation', () => {
    it('should validate valid quantity', () => {
      const result = validateStockOperation(10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject zero quantity', () => {
      const result = validateStockOperation(0);
      expect(result.isValid).toBe(false);
    });

    it('should reject negative quantity', () => {
      const result = validateStockOperation(-5);
      expect(result.isValid).toBe(false);
    });

    it('should reject non-integer quantity', () => {
      const result = validateStockOperation(5.5);
      expect(result.isValid).toBe(false);
    });

    it('should reject unreasonably high quantity', () => {
      const result = validateStockOperation(200000);
      expect(result.isValid).toBe(false);
    });

    it('should reject undefined quantity', () => {
      const result = validateStockOperation(undefined);
      expect(result.isValid).toBe(false);
    });
  });
});
