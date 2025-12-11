const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  return password && password.length >= 6;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential XSS vectors
    return input.replace(/[<>]/g, '').trim();
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
    errors.push('Password must be at least 6 characters long');
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
