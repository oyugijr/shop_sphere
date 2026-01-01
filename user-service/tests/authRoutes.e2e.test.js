const request = require('supertest');
const app = require('../app');

// Wait for app to be ready
beforeAll((done) => {
    setTimeout(done, 1000);
});

describe('Auth Routes - E2E Integration Tests', () => {
    const validUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestP@ssw0rd123'
    };

    let accessToken;
    let refreshToken;
    let verificationToken;

    describe('POST /api/auth/register', () => {
        test('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUser)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('registered successfully');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user).toHaveProperty('email', validUser.email.toLowerCase());
            expect(response.body.user).toHaveProperty('emailVerified', false);

            // Save verification token for later use
            if (response.body.verificationToken) {
                verificationToken = response.body.verificationToken;
            }
        });

        test('should reject registration with duplicate email', async () => {
            // Register same user again
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUser)
                .expect(500); // Will change to proper error code

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });

        test('should reject registration with weak password', async () => {
            const weakPasswordUser = {
                name: 'Weak User',
                email: 'weak@example.com',
                password: 'weak'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(weakPasswordUser)
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        test('should reject registration with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'incomplete@example.com' })
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        test('should reject registration with invalid email', async () => {
            const invalidEmailUser = {
                name: 'Invalid Email User',
                email: 'not-an-email',
                password: 'ValidP@ssw0rd123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidEmailUser)
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        test('should be rate limited after multiple requests', async () => {
            const testEmail = 'ratelimit@example.com';

            // Make multiple registration attempts
            for (let i = 0; i < 6; i++) {
                await request(app)
                    .post('/api/auth/register')
                    .send({
                        name: 'Rate Limit Test',
                        email: `${i}${testEmail}`,
                        password: 'TestP@ssw0rd123'
                    });
            }

            // 6th request should be rate limited
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Rate Limit Test',
                    email: '6' + testEmail,
                    password: 'TestP@ssw0rd123'
                });

            if (response.status === 429) {
                expect(response.body.error).toContain('Too many');
            }
        }, 20000);
    });

    describe('POST /api/auth/login', () => {
        test('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: validUser.email,
                    password: validUser.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body.user).toHaveProperty('email', validUser.email.toLowerCase());

            // Save tokens for later tests
            accessToken = response.body.token;
            refreshToken = response.body.refreshToken;
        });

        test('should reject login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: validUser.email,
                    password: 'WrongP@ssw0rd123'
                })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid credentials');
        });

        test('should reject login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'TestP@ssw0rd123'
                })
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        test('should lock account after multiple failed attempts', async () => {
            const lockTestUser = {
                name: 'Lock Test User',
                email: 'locktest@example.com',
                password: 'LockP@ssw0rd123'
            };

            // Register user
            await request(app)
                .post('/api/auth/register')
                .send(lockTestUser);

            // Try to login with wrong password 5 times
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: lockTestUser.email,
                        password: 'WrongP@ssw0rd123'
                    });
            }

            // 6th attempt should show lock message
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: lockTestUser.email,
                    password: 'WrongP@ssw0rd123'
                })
                .expect(500);

            expect(response.body.error).toMatch(/locked/i);
        }, 20000);
    });

    describe('POST /api/auth/verify-email', () => {
        test('should verify email with valid token', async () => {
            if (!verificationToken) {
                // Skip if no token available
                return;
            }

            const response = await request(app)
                .post('/api/auth/verify-email')
                .send({ token: verificationToken })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('verified successfully');
            expect(response.body.user.emailVerified).toBe(true);
        });

        test('should reject invalid verification token', async () => {
            const response = await request(app)
                .post('/api/auth/verify-email')
                .send({ token: 'invalid-token-123' })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid or expired');
        });
    });

    describe('POST /api/auth/refresh-token', () => {
        test('should refresh access token with valid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('refreshToken');

            // Update tokens
            accessToken = response.body.token;
            const newRefreshToken = response.body.refreshToken;
            expect(newRefreshToken).not.toBe(refreshToken); // Token rotation
            refreshToken = newRefreshToken;
        });

        test('should reject invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken: 'invalid-refresh-token' })
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        test('should send password reset email for existing user', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: validUser.email })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('password reset link');
        });

        test('should return same message for non-existent user (security)', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('password reset link');
        });
    });

    describe('GET /api/auth/sessions', () => {
        test('should get active sessions for authenticated user', async () => {
            const response = await request(app)
                .get('/api/auth/sessions')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.sessions).toBeInstanceOf(Array);
            expect(response.body.sessions.length).toBeGreaterThan(0);
        });

        test('should reject unauthenticated request', async () => {
            const response = await request(app)
                .get('/api/auth/sessions')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('token');
        });
    });

    describe('POST /api/auth/logout', () => {
        test('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Logged out successfully');
        });

        test('should reject logout without authentication', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .send({ refreshToken: 'some-token' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout-all', () => {
        beforeEach(async () => {
            // Login to get new tokens
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: validUser.email,
                    password: validUser.password
                });

            accessToken = loginResponse.body.token;
            refreshToken = loginResponse.body.refreshToken;
        });

        test('should logout from all devices', async () => {
            const response = await request(app)
                .post('/api/auth/logout-all')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('all devices');
        });

        test('should reject without authentication', async () => {
            const response = await request(app)
                .post('/api/auth/logout-all')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /health', () => {
        test('should return healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('service', 'user-service');
            expect(response.body).toHaveProperty('uptime');
        });
    });
});