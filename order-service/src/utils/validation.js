const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential XSS vectors - comprehensive sanitization
    // Note: For production, consider using a library like 'validator' or 'dompurify'
    let sanitized = input;
    
    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    dangerousProtocols.forEach(protocol => {
      const regex = new RegExp(protocol, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    // Remove event handlers more thoroughly
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');
    
    // Remove angle brackets to prevent HTML injection
    sanitized = sanitized.replace(/[<>]/g, '');
    
    return sanitized.trim();
  }
  return input;
};

const validateOrder = (data) => {
  const errors = [];

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    data.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${index + 1}: Valid quantity is required (must be >= 1)`);
      }
      if (item.price === undefined || item.price < 0) {
        errors.push(`Item ${index + 1}: Valid price is required (must be >= 0)`);
      }
    });
  }

  if (!data.shippingAddress) {
    errors.push('Shipping address is required');
  } else {
    const { street, city, state, zipCode, country } = data.shippingAddress;
    if (!street || street.trim().length < 5) {
      errors.push('Valid street address is required');
    }
    if (!city || city.trim().length < 2) {
      errors.push('Valid city is required');
    }
    if (!state || state.trim().length < 2) {
      errors.push('Valid state is required');
    }
    if (!zipCode || zipCode.trim().length < 3) {
      errors.push('Valid zip code is required');
    }
    if (!country || country.trim().length < 2) {
      errors.push('Valid country is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateOrderStatus = (status) => {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  return validStatuses.includes(status);
};

module.exports = {
  sanitizeInput,
  validateOrder,
  validateOrderStatus
};
