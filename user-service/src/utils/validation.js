const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const MIN_PASSWORD_LENGTH = 8;

const validatePassword = (password) => {
  // Use the strong password validator
  const { validatePasswordStrength } = require('./passwordValidator');
  return validatePasswordStrength(password).isValid;
};

const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  // Basic international phone validation
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

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

const validateUserRegistration = (data) => {
  const errors = [];
  const { validatePasswordStrength } = require('./passwordValidator');

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (data.name && data.name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Valid phone number is required (minimum 10 digits)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUserUpdate = (data) => {
  const errors = [];

  if (data.name && data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (data.name && data.name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Valid phone number is required (minimum 10 digits)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validatePasswordChange = (data) => {
  const errors = [];
  const { validatePasswordStrength } = require('./passwordValidator');

  if (!data.currentPassword) {
    errors.push('Current password is required');
  }

  if (!data.newPassword) {
    errors.push('New password is required');
  } else {
    const passwordValidation = validatePasswordStrength(data.newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
    errors.push('New password must be different from current password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  sanitizeInput,
  validateUserRegistration,
  validateUserUpdate,
  validatePasswordChange
};
