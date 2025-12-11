const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const MIN_PASSWORD_LENGTH = 6;

const validatePassword = (password) => {
  // At least 6 characters minimum
  return password && password.length >= MIN_PASSWORD_LENGTH;
};

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

const validateUserRegistration = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || !validatePassword(data.password)) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
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

  if (data.email && !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateUserRegistration,
  validateUserUpdate
};
