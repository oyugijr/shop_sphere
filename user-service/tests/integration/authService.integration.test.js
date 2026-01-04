const authService = require('../../src/services/authService');
const userRepository = require('../../src/repositories/userRepository');
const AccountLockout = require('../../src/models/AccountLockout');
const AuditLog = require('../../src/models/AuditLog');
const EmailVerificationToken = require('../../src/models/EmailVerificationToken');
const PasswordResetToken = require('../../src/models/PasswordResetToken');
const RefreshToken = require('../../src/models/RefreshToken');

describe('Auth Service - Integration Tests (No Mocks)', () => {
    const mockIp = '127.0.0.1';
    const mockUserAgent = 'Jest Test Agent';

    const validUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'ValidP@ssw0rd123'
    };

    describe('registerUser', () => {
        test('should register a new user with valid data', async () => {
            const result = await authService.registerUser(validUserData, mockIp, mockUserAgent);

            expect(result).toHaveProperty('message');
            expect(result.message).toContain('registered successfully');
            expect(result.user).toHaveProperty('id');
            expect(result.user).toHaveProperty('email', validUserData.email.toLowerCase());
            expect(result.user).toHaveProperty('name', validUserData.name);
            expect(result.user).toHaveProperty('role', 'user');
            expect(result.user).toHaveProperty('emailVerified', false);

            // Verify user was created in database
            const dbUser = await userRepository.findByEmail(validUserData.email);
            expect(dbUser).toBeTruthy();
            expect(dbUser.email).toBe(validUserData.email.toLowerCase());
            expect(dbUser.password).not.toBe(validUserData.password); // Password should be hashed

            // Verify audit log was created
            const auditLogs = await AuditLog.find({ email: validUserData.email.toLowerCase() });
            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].action).toBe('REGISTER');
        });

        test('should reject registration with weak password', async () => {
            const weakPasswordData = {
                ...validUserData,
                password: 'weak'
            };

            await expect(
                authService.registerUser(weakPasswordData, mockIp, mockUserAgent)
            ).rejects.toThrow();
        });

        test('should reject registration with duplicate email', async () => {
            await authService.registerUser(validUserData, mockIp, mockUserAgent);

            await expect(
                authService.registerUser(validUserData, mockIp, mockUserAgent)
            ).rejects.toThrow('User with this email already exists');
        });

        test('should sanitize user input', async () => {
            const unsafeData = {
                name: '<script>alert("xss")</script>John',
                email: 'test@example.com',
                password: 'ValidP@ssw0rd123'
            };

            const result = await authService.registerUser(unsafeData, mockIp, mockUserAgent);

            expect(result.user.name).not.toContain('<script>');
            expect(result.user.name).not.toContain('</script>');
        });
    });

    describe('loginUser', () => {
        beforeEach(async () => {
            // Register a user for login tests
            await authService.registerUser(validUserData, mockIp, mockUserAgent);
        });

        test('should login successfully with valid credentials', async () => {
            const result = await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                mockIp,
                mockUserAgent
            );

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('refreshToken');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe(validUserData.email.toLowerCase());

            // Verify refresh token was created
            const refreshTokens = await RefreshToken.find({ userId: result.user.id });
            expect(refreshTokens.length).toBeGreaterThan(0);

            // Verify audit log was created
            const auditLogs = await AuditLog.find({
                email: validUserData.email.toLowerCase(),
                action: 'LOGIN_SUCCESS'
            });
            expect(auditLogs.length).toBeGreaterThan(0);
        });

        test('should reject login with invalid password', async () => {
            await expect(
                authService.loginUser(
                    { email: validUserData.email, password: 'WrongP@ssw0rd123' },
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow('Invalid credentials');

            // Verify failed attempt was logged
            const auditLogs = await AuditLog.find({
                email: validUserData.email.toLowerCase(),
                action: 'LOGIN_FAILURE'
            });
            expect(auditLogs.length).toBeGreaterThan(0);
        });

        test('should reject login with non-existent email', async () => {
            await expect(
                authService.loginUser(
                    { email: 'nonexistent@example.com', password: 'ValidP@ssw0rd123' },
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow();
        });

        test('should lock account after 5 failed attempts', async () => {
            const wrongPassword = 'WrongP@ssw0rd123';

            // Try to login 5 times with wrong password
            for (let i = 0; i < 5; i++) {
                try {
                    await authService.loginUser(
                        { email: validUserData.email, password: wrongPassword },
                        mockIp,
                        mockUserAgent
                    );
                } catch (error) {
                    // Expected to fail
                }
            }

            // 6th attempt should return lockout message
            await expect(
                authService.loginUser(
                    { email: validUserData.email, password: wrongPassword },
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow(/locked/i);

            // Verify account lockout was created
            const lockout = await AccountLockout.findOne({ email: validUserData.email.toLowerCase() });
            expect(lockout).toBeTruthy();
            expect(lockout.isLocked()).toBe(true);
        });

        test('should reset failed attempts after successful login', async () => {
            const wrongPassword = 'WrongP@ssw0rd123';

            // Fail once
            try {
                await authService.loginUser(
                    { email: validUserData.email, password: wrongPassword },
                    mockIp,
                    mockUserAgent
                );
            } catch (error) {
                // Expected to fail
            }

            // Successful login
            await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                mockIp,
                mockUserAgent
            );

            // Verify failed attempts were reset
            const lockout = await AccountLockout.findOne({ email: validUserData.email.toLowerCase() });
            expect(lockout.failedAttempts).toBe(0);
        });
    });

    describe('verifyEmail', () => {
        test('should verify email with valid token', async () => {
            const registerResult = await authService.registerUser(validUserData, mockIp, mockUserAgent);

            // Get the verification token from development mode
            const token = registerResult.verificationToken;
            expect(token).toBeTruthy();

            const result = await authService.verifyEmail(token, mockIp, mockUserAgent);

            expect(result.message).toContain('verified successfully');
            expect(result.user.emailVerified).toBe(true);

            // Verify user in database is verified
            const dbUser = await userRepository.findByEmail(validUserData.email);
            expect(dbUser.emailVerified).toBe(true);
            expect(dbUser.emailVerifiedAt).toBeTruthy();
        });

        test('should reject invalid verification token', async () => {
            await expect(
                authService.verifyEmail('invalid-token', mockIp, mockUserAgent)
            ).rejects.toThrow('Invalid or expired verification token');
        });

        test('should mark token as used after verification', async () => {
            const registerResult = await authService.registerUser(validUserData, mockIp, mockUserAgent);
            const token = registerResult.verificationToken;

            await authService.verifyEmail(token, mockIp, mockUserAgent);

            // Try to use the same token again
            await expect(
                authService.verifyEmail(token, mockIp, mockUserAgent)
            ).rejects.toThrow('Invalid or expired verification token');
        });
    });

    describe('requestPasswordReset', () => {
        beforeEach(async () => {
            await authService.registerUser(validUserData, mockIp, mockUserAgent);
        });

        test('should create password reset token for existing user', async () => {
            const result = await authService.requestPasswordReset(validUserData.email, mockIp, mockUserAgent);

            expect(result.message).toContain('password reset link');

            // In development mode, token should be returned
            if (process.env.NODE_ENV !== 'production') {
                expect(result.resetToken).toBeTruthy();
            }

            // Verify token was created in database
            const user = await userRepository.findByEmail(validUserData.email);
            const tokens = await PasswordResetToken.find({ userId: user._id, used: false });
            expect(tokens.length).toBeGreaterThan(0);
        });

        test('should not reveal if user does not exist', async () => {
            const result = await authService.requestPasswordReset('nonexistent@example.com', mockIp, mockUserAgent);

            expect(result.message).toContain('password reset link');
            // Same message as success case for security
        });

        test('should invalidate old reset tokens when creating new one', async () => {
            const user = await userRepository.findByEmail(validUserData.email);

            // Create first token
            const result1 = await authService.requestPasswordReset(validUserData.email, mockIp, mockUserAgent);

            // Create second token
            const result2 = await authService.requestPasswordReset(validUserData.email, mockIp, mockUserAgent);

            // First token should be invalidated
            const oldTokens = await PasswordResetToken.find({ userId: user._id, used: true });
            expect(oldTokens.length).toBeGreaterThan(0);
        });
    });

    describe('resetPassword', () => {
        let resetToken;

        beforeEach(async () => {
            await authService.registerUser(validUserData, mockIp, mockUserAgent);
            const result = await authService.requestPasswordReset(validUserData.email, mockIp, mockUserAgent);
            resetToken = result.resetToken;
        });

        test('should reset password with valid token', async () => {
            const newPassword = 'NewP@ssw0rd456';

            const result = await authService.resetPassword(resetToken, newPassword, mockIp, mockUserAgent);

            expect(result.message).toContain('reset successfully');

            // Try to login with new password
            const loginResult = await authService.loginUser(
                { email: validUserData.email, password: newPassword },
                mockIp,
                mockUserAgent
            );

            expect(loginResult).toHaveProperty('token');
        });

        test('should reject weak password during reset', async () => {
            await expect(
                authService.resetPassword(resetToken, 'weak', mockIp, mockUserAgent)
            ).rejects.toThrow();
        });

        test('should reject invalid reset token', async () => {
            await expect(
                authService.resetPassword('invalid-token', 'NewP@ssw0rd456', mockIp, mockUserAgent)
            ).rejects.toThrow('Invalid or expired reset token');
        });

        test('should not allow reusing reset token', async () => {
            const newPassword = 'NewP@ssw0rd456';

            await authService.resetPassword(resetToken, newPassword, mockIp, mockUserAgent);

            // Try to use the same token again
            await expect(
                authService.resetPassword(resetToken, 'AnotherP@ssw0rd789', mockIp, mockUserAgent)
            ).rejects.toThrow('Invalid or expired reset token');
        });

        test('should revoke all refresh tokens after password reset', async () => {
            const user = await userRepository.findByEmail(validUserData.email);

            // Create a refresh token
            await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                mockIp,
                mockUserAgent
            );

            // Reset password
            await authService.resetPassword(resetToken, 'NewP@ssw0rd456', mockIp, mockUserAgent);

            // All refresh tokens should be revoked
            const activeTokens = await RefreshToken.find({ userId: user._id, revoked: false });
            expect(activeTokens.length).toBe(0);
        });
    });

    describe('refreshAccessToken', () => {
        let refreshToken;
        let user;

        beforeEach(async () => {
            await authService.registerUser(validUserData, mockIp, mockUserAgent);
            const loginResult = await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                mockIp,
                mockUserAgent
            );
            refreshToken = loginResult.refreshToken;
            user = loginResult.user;
        });

        test('should issue new access token with valid refresh token', async () => {
            const result = await authService.refreshAccessToken(refreshToken, mockIp, mockUserAgent);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.id).toBe(user.id);

            // New refresh token should be different (token rotation)
            expect(result.refreshToken).not.toBe(refreshToken);
        });

        test('should revoke old refresh token after rotation', async () => {
            await authService.refreshAccessToken(refreshToken, mockIp, mockUserAgent);

            // Old token should be revoked
            const oldToken = await RefreshToken.findOne({ token: refreshToken });
            expect(oldToken.revoked).toBe(true);
        });

        test('should reject invalid refresh token', async () => {
            await expect(
                authService.refreshAccessToken('invalid-token', mockIp, mockUserAgent)
            ).rejects.toThrow();
        });

        test('should reject revoked refresh token', async () => {
            // Use the token once
            await authService.refreshAccessToken(refreshToken, mockIp, mockUserAgent);

            // Try to use the old token again
            await expect(
                authService.refreshAccessToken(refreshToken, mockIp, mockUserAgent)
            ).rejects.toThrow();
        });
    });

    describe('logout', () => {
        let refreshToken;
        let userId;

        beforeEach(async () => {
            await authService.registerUser(validUserData, mockIp, mockUserAgent);
            const loginResult = await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                mockIp,
                mockUserAgent
            );
            refreshToken = loginResult.refreshToken;
            userId = loginResult.user.id;
        });

        test('should revoke refresh token on logout', async () => {
            const result = await authService.logout(refreshToken, userId, mockIp, mockUserAgent);

            expect(result.message).toContain('Logged out successfully');

            // Token should be revoked
            const token = await RefreshToken.findOne({ token: refreshToken });
            expect(token.revoked).toBe(true);
        });

        test('should log logout audit event', async () => {
            await authService.logout(refreshToken, userId, mockIp, mockUserAgent);

            const auditLogs = await AuditLog.find({
                userId,
                action: 'LOGOUT'
            });

            expect(auditLogs.length).toBeGreaterThan(0);
        });
    });

    describe('logoutAllDevices', () => {
        let userId;

        beforeEach(async () => {
            await authService.registerUser(validUserData, mockIp, mockUserAgent);

            // Login from multiple devices
            const login1 = await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                '192.168.1.1',
                'Device 1'
            );

            await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                '192.168.1.2',
                'Device 2'
            );

            userId = login1.user.id;
        });

        test('should revoke all refresh tokens for user', async () => {
            await authService.logoutAllDevices(userId, mockIp, mockUserAgent);

            // All tokens should be revoked
            const activeTokens = await RefreshToken.find({ userId, revoked: false });
            expect(activeTokens.length).toBe(0);
        });

        test('should log audit event for logout all devices', async () => {
            await authService.logoutAllDevices(userId, mockIp, mockUserAgent);

            const auditLogs = await AuditLog.find({
                userId,
                action: 'LOGOUT_ALL_DEVICES'
            });

            expect(auditLogs.length).toBeGreaterThan(0);
        });
    });

    describe('getActiveSessions', () => {
        let userId;

        beforeEach(async () => {
            await authService.registerUser(validUserData, mockIp, mockUserAgent);

            // Login from multiple devices
            const login = await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                '192.168.1.1',
                'Device 1'
            );

            await authService.loginUser(
                { email: validUserData.email, password: validUserData.password },
                '192.168.1.2',
                'Device 2'
            );

            userId = login.user.id;
        });

        test('should return all active sessions for user', async () => {
            const sessions = await authService.getActiveSessions(userId);

            expect(sessions.length).toBe(2);
            expect(sessions[0]).toHaveProperty('ipAddress');
            expect(sessions[0]).toHaveProperty('userAgent');
            expect(sessions[0]).toHaveProperty('createdAt');
        });

        test('should not include revoked sessions', async () => {
            await authService.logoutAllDevices(userId, mockIp, mockUserAgent);

            const sessions = await authService.getActiveSessions(userId);
            expect(sessions.length).toBe(0);
        });
    });
});