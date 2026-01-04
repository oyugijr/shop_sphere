const { validatePasswordStrength } = require('../../src/utils/passwordValidator');

// This is a unit test and doesn't need database
describe('Password Validator - Unit Tests', () => {
    describe('validatePasswordStrength', () => {
        test('should accept a strong password', () => {
            const result = validatePasswordStrength('MyP@ssw0rd123');

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject password that is too short', () => {
            const result = validatePasswordStrength('P@ss1');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        test('should reject password without uppercase letter', () => {
            const result = validatePasswordStrength('p@ssword123');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        test('should reject password without lowercase letter', () => {
            const result = validatePasswordStrength('P@SSWORD123');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        test('should reject password without number', () => {
            const result = validatePasswordStrength('P@ssword');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        test('should reject password without special character', () => {
            const result = validatePasswordStrength('Password123');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>?)');
        });

        test('should reject common passwords', () => {
            const commonPasswords = ['password', 'password123', 'Password123'];

            commonPasswords.forEach(password => {
                const result = validatePasswordStrength(password);
                expect(result.isValid).toBe(false);
            });
        });

        test('should reject password that is too long', () => {
            const longPassword = 'P@ssw0rd' + 'a'.repeat(130);
            const result = validatePasswordStrength(longPassword);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must not exceed 128 characters');
        });

        test('should handle null or undefined password', () => {
            const resultNull = validatePasswordStrength(null);
            const resultUndefined = validatePasswordStrength(undefined);

            expect(resultNull.isValid).toBe(false);
            expect(resultUndefined.isValid).toBe(false);
            expect(resultNull.errors).toContain('Password is required');
            expect(resultUndefined.errors).toContain('Password is required');
        });

        test('should accept password with various special characters', () => {
            const passwords = [
                'MyP@ssw0rd',
                'MyP#ssw0rd',
                'MyP$ssw0rd',
                'MyP%ssw0rd',
                'MyP^ssw0rd',
                'MyP&ssw0rd'
            ];

            passwords.forEach(password => {
                const result = validatePasswordStrength(password);
                expect(result.isValid).toBe(true);
            });
        });

        test('should provide multiple error messages for weak password', () => {
            const result = validatePasswordStrength('weak');

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
            expect(result.errors).toContain('Password must be at least 8 characters long');
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });
    });
});
