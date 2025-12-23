const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential XSS vectors - comprehensive sanitization
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

  // Validate items
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    data.items.forEach((item, index) => {
      if (!item.productId && !item.product) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${index + 1}: Valid quantity is required (must be >= 1)`);
      }
      if (item.price === undefined || item.price < 0) {
        errors.push(`Item ${index + 1}: Valid price is required (must be >= 0)`);
      }
      if (!item.name || item.name.trim().length === 0) {
        errors.push(`Item ${index + 1}: Product name is required`);
      }
    });
  }

  // validate shipping address
  if (!data.shippingAddress) {
    errors.push('Shipping address is required');
  } else {
    const { fullName, phoneNumber, street, city, state, zipCode, country } = data.shippingAddress;

    if (!fullName || fullName.trim().length < 2) {
      errors.push('Valid full name is required');
    }
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      errors.push('Valid phone number is required');
    }
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

  // Validate total price
  if (data.totalPrice === undefined || data.totalPrice < 0) {
    errors.push('Valid total price is required (must be >= 0)');
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

const validatePaymentStatus = (status) => {
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
  return validStatuses.includes(status);
};

const validatePaymentMethod = (method) => {
  const validMethods = ['stripe', 'mpesa', 'paypal', 'cash_on_delivery'];
  return validMethods.includes(method);
};

const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  sanitizeInput,
  validateOrder,
  validateOrderStatus,
  validatePaymentStatus,
  validatePaymentMethod,
  validateObjectId
};
