const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential XSS vectors - basic sanitization
    // For production, consider using a library like 'validator' or 'dompurify'
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  return input;
};

const validateProduct = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('Product description must be at least 10 characters long');
  }

  if (data.price === undefined || data.price < 0) {
    errors.push('Valid price is required (must be >= 0)');
  }

  if (!data.category || data.category.trim().length < 2) {
    errors.push('Product category is required');
  }

  if (data.stock === undefined || data.stock < 0) {
    errors.push('Valid stock quantity is required (must be >= 0)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateProductUpdate = (data) => {
  const errors = [];

  if (data.name && data.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long');
  }

  if (data.description && data.description.trim().length < 10) {
    errors.push('Product description must be at least 10 characters long');
  }

  if (data.price !== undefined && data.price < 0) {
    errors.push('Price must be >= 0');
  }

  if (data.stock !== undefined && data.stock < 0) {
    errors.push('Stock quantity must be >= 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  sanitizeInput,
  validateProduct,
  validateProductUpdate
};
