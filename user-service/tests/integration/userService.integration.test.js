const userService = require('../../src/services/userService');
const authService = require('../../src/services/authService');
const AuditLog = require('../../src/models/AuditLog');

describe('User Service - Integration Tests (No Mocks)', () => {
    const mockIp = '127.0.0.1';
    const mockUserAgent = 'Jest Test Agent';

    const adminUserData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'AdminP@ssw0rd123',
        role: 'admin'
    };

    const regularUserData = {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'UserP@ssw0rd123'
    };

    let adminUserId, regularUserId;

    beforeEach(async () => {
        // Create admin user
        const adminResult = await authService.registerUser(adminUserData, mockIp, mockUserAgent);
        adminUserId = adminResult.user.id;

        // Update admin role directly
        const userRepository = require('../../src/repositories/userRepository');
        await userRepository.updateUserRole(adminUserId, 'admin');

        // Create regular user
        const userResult = await authService.registerUser(regularUserData, mockIp, mockUserAgent);
        regularUserId = userResult.user.id;
    });

    describe('getUserById', () => {
        test('should get user by ID', async () => {
            const user = await userService.getUserById(regularUserId);

            expect(user).toHaveProperty('id', regularUserId);
            expect(user).toHaveProperty('email', regularUserData.email.toLowerCase());
            expect(user).toHaveProperty('name', regularUserData.name);
            expect(user).not.toHaveProperty('password'); // Password should not be returned
        });

        test('should throw error for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            await expect(
                userService.getUserById(fakeId)
            ).rejects.toThrow('User not found');
        });
    });

    describe('updateUserProfile', () => {
        test('should update user profile successfully', async () => {
            const updateData = {
                name: 'Updated Name',
                phone: '+1234567890',
                address: {
                    street: '123 Main St',
                    city: 'Test City',
                    state: 'Test State',
                    country: 'Test Country',
                    zipCode: '12345'
                }
            };

            const result = await userService.updateUserProfile(
                regularUserId,
                updateData,
                mockIp,
                mockUserAgent
            );

            expect(result.name).toBe(updateData.name);
            expect(result.phone).toBe(updateData.phone);
            expect(result.address.street).toBe(updateData.address.street);
            expect(result.address.city).toBe(updateData.address.city);

            // Verify audit log was created
            const auditLogs = await AuditLog.find({
                userId: regularUserId,
                action: 'PROFILE_UPDATED'
            });
            expect(auditLogs.length).toBeGreaterThan(0);
        });

        test('should sanitize input during profile update', async () => {
            const updateData = {
                name: '<script>alert("xss")</script>Updated Name'
            };

            const result = await userService.updateUserProfile(
                regularUserId,
                updateData,
                mockIp,
                mockUserAgent
            );

            expect(result.name).not.toContain('<script>');
            expect(result.name).not.toContain('</script>');
        });

        test('should reject invalid phone number', async () => {
            const updateData = {
                phone: '123' // Too short
            };

            await expect(
                userService.updateUserProfile(
                    regularUserId,
                    updateData,
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow();
        });

        test('should reject invalid name', async () => {
            const updateData = {
                name: 'A' // Too short
            };

            await expect(
                userService.updateUserProfile(
                    regularUserId,
                    updateData,
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow();
        });
    });

    describe('changePassword', () => {
        test('should change password successfully', async () => {
            const currentPassword = regularUserData.password;
            const newPassword = 'NewP@ssw0rd456';

            const result = await userService.changePassword(
                regularUserId,
                currentPassword,
                newPassword,
                mockIp,
                mockUserAgent
            );

            expect(result.message).toContain('Password changed successfully');

            // Verify can login with new password
            const loginResult = await authService.loginUser(
                { email: regularUserData.email, password: newPassword },
                mockIp,
                mockUserAgent
            );

            expect(loginResult).toHaveProperty('token');

            // Verify audit log was created
            const auditLogs = await AuditLog.find({
                userId: regularUserId,
                action: 'PASSWORD_CHANGED',
                success: true
            });
            expect(auditLogs.length).toBeGreaterThan(0);
        });

        test('should reject incorrect current password', async () => {
            await expect(
                userService.changePassword(
                    regularUserId,
                    'WrongP@ssw0rd123',
                    'NewP@ssw0rd456',
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow('Current password is incorrect');

            // Verify failed audit log was created
            const auditLogs = await AuditLog.find({
                userId: regularUserId,
                action: 'PASSWORD_CHANGED',
                success: false
            });
            expect(auditLogs.length).toBeGreaterThan(0);
        });

        test('should reject weak new password', async () => {
            await expect(
                userService.changePassword(
                    regularUserId,
                    regularUserData.password,
                    'weak',
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow();
        });

        test('should reject if new password is same as current', async () => {
            await expect(
                userService.changePassword(
                    regularUserId,
                    regularUserData.password,
                    regularUserData.password,
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow('New password must be different from current password');
        });
    });

    describe('getAllUsers (Admin)', () => {
        test('should get all users with pagination', async () => {
            const result = await userService.getAllUsers({}, { page: 1, limit: 10 });

            expect(result.users).toBeInstanceOf(Array);
            expect(result.users.length).toBeGreaterThanOrEqual(2); // At least admin and regular user
            expect(result.pagination).toHaveProperty('total');
            expect(result.pagination).toHaveProperty('page', 1);
            expect(result.pagination).toHaveProperty('limit', 10);

            // Users should not have password field
            result.users.forEach(user => {
                expect(user).not.toHaveProperty('password');
            });
        });

        test('should filter users by role', async () => {
            const result = await userService.getAllUsers({ role: 'admin' }, { page: 1, limit: 10 });

            expect(result.users.length).toBeGreaterThan(0);
            result.users.forEach(user => {
                expect(user.role).toBe('admin');
            });
        });

        test('should filter users by emailVerified status', async () => {
            const result = await userService.getAllUsers({ emailVerified: false }, { page: 1, limit: 10 });

            expect(result.users.length).toBeGreaterThan(0);
            result.users.forEach(user => {
                expect(user.emailVerified).toBe(false);
            });
        });
    });

    describe('updateUserRole (Admin)', () => {
        test('should update user role from user to admin', async () => {
            const result = await userService.updateUserRole(
                adminUserId,
                regularUserId,
                'admin',
                mockIp,
                mockUserAgent
            );

            expect(result.role).toBe('admin');

            // Verify audit log was created
            const auditLogs = await AuditLog.find({
                userId: regularUserId,
                action: 'ROLE_CHANGED'
            });
            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].metadata.newRole).toBe('admin');
            expect(auditLogs[0].metadata.changedBy).toBe(adminUserId);
        });

        test('should not allow user to change own role', async () => {
            await expect(
                userService.updateUserRole(
                    adminUserId,
                    adminUserId,
                    'user',
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow('You cannot change your own role');
        });

        test('should reject invalid role', async () => {
            await expect(
                userService.updateUserRole(
                    adminUserId,
                    regularUserId,
                    'superadmin',
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow('Invalid role');
        });
    });

    describe('deleteUser (Admin)', () => {
        test('should soft delete user', async () => {
            const result = await userService.deleteUser(
                adminUserId,
                regularUserId,
                mockIp,
                mockUserAgent
            );

            expect(result.message).toContain('deleted successfully');

            // Verify user is soft deleted
            const userRepository = require('../../src/repositories/userRepository');
            const deletedUser = await userRepository.findById(regularUserId);
            expect(deletedUser).toBeNull(); // findById excludes deleted users

            // Verify audit log was created
            const auditLogs = await AuditLog.find({
                userId: regularUserId,
                action: 'ACCOUNT_DELETED'
            });
            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].metadata.deletedBy).toBe(adminUserId);
        });

        test('should not allow user to delete own account', async () => {
            await expect(
                userService.deleteUser(
                    adminUserId,
                    adminUserId,
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow('You cannot delete your own account');
        });

        test('should throw error for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            await expect(
                userService.deleteUser(
                    adminUserId,
                    fakeId,
                    mockIp,
                    mockUserAgent
                )
            ).rejects.toThrow('User not found');
        });
    });

    describe('getUserAuditLogs', () => {
        test('should get audit logs for user', async () => {
            // Generate some audit logs
            await userService.updateUserProfile(
                regularUserId,
                { name: 'New Name' },
                mockIp,
                mockUserAgent
            );

            const logs = await userService.getUserAuditLogs(regularUserId, 10);

            expect(logs).toBeInstanceOf(Array);
            expect(logs.length).toBeGreaterThan(0);

            logs.forEach(log => {
                expect(log.userId.toString()).toBe(regularUserId);
                expect(log).toHaveProperty('action');
                expect(log).toHaveProperty('ipAddress');
                expect(log).toHaveProperty('createdAt');
            });
        });

        test('should limit number of logs returned', async () => {
            const logs = await userService.getUserAuditLogs(regularUserId, 5);

            expect(logs.length).toBeLessThanOrEqual(5);
        });
    });
});