const validator = require('validator');

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
    const errors = [];

    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
        return { isValid: false, errors };
    }

    // Check minimum length
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    // Check maximum length (prevent DoS)
    if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>?)');
    }

    // Check for common weak passwords
    const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty123',
        'abc123456', 'password1', 'Password1', 'Password123'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common. Please choose a more unique password');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Sanitizes password to ensure it doesn't contain dangerous characters
 * @param {string} password - Password to sanitize
 * @returns {string} - Sanitized password
 */
const sanitizePassword = (password) => {
    if (typeof password !== 'string') return '';

    // Trim whitespace
    return password.trim();
};

module.exports = {
    validatePasswordStrength,
    sanitizePassword
};