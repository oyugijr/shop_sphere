const mongoose = require('mongoose');

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    let sanitized = input;
    
    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    dangerousProtocols.forEach(protocol => {
      const regex = new RegExp(protocol, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    // Remove event handlers
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');
    
    // Remove angle brackets to prevent HTML injection
    sanitized = sanitized.replace(/[<>]/g, '');
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    return sanitized.trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate product data for creation
 */
const validateProduct = (data) => {
  const errors = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Product name is required and must be a string');
  } else if (data.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long');
  } else if (data.name.trim().length > 200) {
    errors.push('Product name cannot exceed 200 characters');
  }

  // Description validation
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Product description is required and must be a string');
  } else if (data.description.trim().length < 10) {
    errors.push('Product description must be at least 10 characters long');
  } else if (data.description.trim().length > 2000) {
    errors.push('Product description cannot exceed 2000 characters');
  }

  // Price validation
  if (data.price === undefined || data.price === null) {
    errors.push('Product price is required');
  } else if (typeof data.price !== 'number' || isNaN(data.price)) {
    errors.push('Product price must be a valid number');
  } else if (data.price < 0) {
    errors.push('Product price cannot be negative');
  } else if (data.price > 10000000) {
    errors.push('Product price seems unreasonably high');
  }

  // Category validation
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Product category is required and must be a string');
  } else if (data.category.trim().length < 2) {
    errors.push('Product category must be at least 2 characters long');
  }

  // Stock validation
  if (data.stock === undefined || data.stock === null) {
    errors.push('Stock quantity is required');
  } else if (typeof data.stock !== 'number' || isNaN(data.stock) || !Number.isInteger(data.stock)) {
    errors.push('Stock quantity must be a valid integer');
  } else if (data.stock < 0) {
    errors.push('Stock quantity cannot be negative');
  }

  // Optional fields validation
  if (data.imageUrl && typeof data.imageUrl !== 'string') {
    errors.push('Image URL must be a string');
  }

  if (data.sku && typeof data.sku !== 'string') {
    errors.push('SKU must be a string');
  }

  if (data.brand && typeof data.brand !== 'string') {
    errors.push('Brand must be a string');
  }

  if (data.rating !== undefined && (typeof data.rating !== 'number' || data.rating < 0 || data.rating > 5)) {
    errors.push('Rating must be a number between 0 and 5');
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate product data for update
 */
const validateProductUpdate = (data) => {
  const errors = [];

  // At least one field must be provided
  const updateFields = ['name', 'description', 'price', 'stock', 'category', 'imageUrl', 'sku', 'brand', 'isActive', 'rating', 'tags'];
  const hasUpdateField = updateFields.some(field => data.hasOwnProperty(field));
  
  if (!hasUpdateField) {
    errors.push('At least one field must be provided for update');
  }

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Product name must be a string');
    } else if (data.name.trim().length < 2) {
      errors.push('Product name must be at least 2 characters long');
    } else if (data.name.trim().length > 200) {
      errors.push('Product name cannot exceed 200 characters');
    }
  }

  // Description validation (if provided)
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Product description must be a string');
    } else if (data.description.trim().length < 10) {
      errors.push('Product description must be at least 10 characters long');
    } else if (data.description.trim().length > 2000) {
      errors.push('Product description cannot exceed 2000 characters');
    }
  }

  // Price validation (if provided)
  if (data.price !== undefined) {
    if (typeof data.price !== 'number' || isNaN(data.price)) {
      errors.push('Product price must be a valid number');
    } else if (data.price < 0) {
      errors.push('Product price cannot be negative');
    } else if (data.price > 10000000) {
      errors.push('Product price seems unreasonably high');
    }
  }

  // Stock validation (if provided)
  if (data.stock !== undefined) {
    if (typeof data.stock !== 'number' || isNaN(data.stock) || !Number.isInteger(data.stock)) {
      errors.push('Stock quantity must be a valid integer');
    } else if (data.stock < 0) {
      errors.push('Stock quantity cannot be negative');
    }
  }

  // Category validation (if provided)
  if (data.category !== undefined) {
    if (typeof data.category !== 'string') {
      errors.push('Product category must be a string');
    } else if (data.category.trim().length < 2) {
      errors.push('Product category must be at least 2 characters long');
    }
  }

  // Optional fields validation
  if (data.imageUrl !== undefined && typeof data.imageUrl !== 'string') {
    errors.push('Image URL must be a string');
  }

  if (data.sku !== undefined && typeof data.sku !== 'string') {
    errors.push('SKU must be a string');
  }

  if (data.brand !== undefined && typeof data.brand !== 'string') {
    errors.push('Brand must be a string');
  }

  if (data.rating !== undefined && (typeof data.rating !== 'number' || data.rating < 0 || data.rating > 5)) {
    errors.push('Rating must be a number between 0 and 5');
  }

  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (page, limit) => {
  const errors = [];
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('Page must be a positive integer');
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push('Limit must be between 1 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page: pageNum,
    limit: limitNum
  };
};

/**
 * Validate stock operation
 */
const validateStockOperation = (quantity) => {
  const errors = [];
  
  if (quantity === undefined || quantity === null) {
    errors.push('Quantity is required');
  } else if (typeof quantity !== 'number' || isNaN(quantity) || !Number.isInteger(quantity)) {
    errors.push('Quantity must be a valid integer');
  } else if (quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  } else if (quantity > 100000) {
    errors.push('Quantity seems unreasonably high');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  sanitizeInput,
  isValidObjectId,
  validateProduct,
  validateProductUpdate,
  validatePagination,
  validateStockOperation
};
