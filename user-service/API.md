# User Service API Documentation

## Base URL

```
http://localhost:5001
```

## Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Rate Limiting

- Auth endpoints: 5 requests per 15 minutes
- Password reset: 3 requests per hour
- Email verification resend: 3 requests per hour
- General API: 100 requests per 15 minutes

---

## Endpoints

### Health Check

#### GET /health

Check service health status.

**Response:**

```json
{
  "status": "healthy",
  "service": "user-service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345,
  "environment": "development"
}
```

---

## Authentication Endpoints

### Register User

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecureP@ssw0rd123",
  "phone": "+1234567890" // Optional
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "emailVerified": false
  },
  "verificationToken": "abc123..." // Only in development mode
}
```

**Validation Rules:**

- Name: 2-100 characters
- Email: Valid email format
- Password: Min 8 characters, must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>?)
- Phone: Optional, min 10 digits if provided

**Error Responses:**

- 400: Validation error
- 409: User already exists
- 429: Too many requests

---

### Login

#### POST /api/auth/login

Authenticate user and receive tokens.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecureP@ssw0rd123"
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "emailVerified": true,
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Account Lockout:**
After 5 failed login attempts, the account is locked for 30 minutes.

**Error Responses:**

- 401: Invalid credentials
- 403: Account locked
- 429: Too many requests

---

### Verify Email

#### POST /api/auth/verify-email

Verify user email address using token.

**Request Body:**

```json
{
  "token": "verification_token_here"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true
  }
}
```

**Error Responses:**

- 400: Invalid or expired token

---

### Resend Verification Email

#### POST /api/auth/resend-verification

Resend email verification link.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox.",
  "verificationToken": "abc123..." // Only in development mode
}
```

**Error Responses:**

- 400: Email already verified
- 404: User not found
- 429: Too many requests (3 per hour)

---

### Refresh Access Token

#### POST /api/auth/refresh-token

Get a new access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "abc123def456..."
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "new_access_token_here",
  "refreshToken": "new_refresh_token_here",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Note:** Implements refresh token rotation. Old refresh token is revoked.

**Error Responses:**

- 401: Invalid or expired refresh token

---

### Forgot Password

#### POST /api/auth/forgot-password

Request password reset email.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "resetToken": "abc123..." // Only in development mode
}
```

**Note:** Always returns success message for security (doesn't reveal if email exists).

**Error Responses:**

- 429: Too many requests (3 per hour)

---

### Reset Password

#### POST /api/auth/reset-password

Reset password using token.

**Request Body:**

```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecureP@ssw0rd456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password."
}
```

**Note:** All existing refresh tokens are revoked for security.

**Error Responses:**

- 400: Invalid or expired token
- 400: Password doesn't meet requirements

---

### Logout

#### POST /api/auth/logout

**Requires Authentication**

Logout from current session.

**Request Body:**

```json
{
  "refreshToken": "abc123def456..."
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Logout from All Devices

#### POST /api/auth/logout-all

**Requires Authentication**

Logout from all active sessions.

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

### Get Active Sessions

#### GET /api/auth/sessions

**Requires Authentication**

Get list of active sessions for current user.

**Response (200):**

```json
{
  "success": true,
  "sessions": [
    {
      "id": "session_id_1",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "id": "session_id_2",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "ipAddress": "192.168.1.2",
      "userAgent": "PostmanRuntime/7.32.3"
    }
  ]
}
```

---

## User Management Endpoints

### Get User Profile

#### GET /api/users/profile

**Requires Authentication**

Get current user's profile.

**Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "emailVerified": true,
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "zipCode": "10001"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Update User Profile

#### PUT /api/users/profile

**Requires Authentication**

Update current user's profile.

**Request Body:**

```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "zipCode": "90001"
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@example.com",
    "role": "user",
    "emailVerified": true,
    "phone": "+1234567890",
    "address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "country": "USA",
      "zipCode": "90001"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

### Change Password

#### PUT /api/users/password

**Requires Authentication**

Change user's password.

**Request Body:**

```json
{
  "currentPassword": "OldSecureP@ssw0rd123",
  "newPassword": "NewSecureP@ssw0rd456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

- 401: Current password is incorrect
- 400: New password doesn't meet requirements
- 400: New password must be different from current

---

### Get User Audit Logs

#### GET /api/users/audit-logs?limit=50

**Requires Authentication**

Get audit logs for current user.

**Query Parameters:**

- `limit`: Number of logs to return (default: 50, max: 100)

**Response (200):**

```json
{
  "success": true,
  "logs": [
    {
      "_id": "log_id_1",
      "userId": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "action": "LOGIN_SUCCESS",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {},
      "success": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "log_id_2",
      "userId": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "action": "PASSWORD_CHANGED",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {},
      "success": true,
      "createdAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

**Audit Actions:**

- LOGIN_SUCCESS
- LOGIN_FAILURE
- LOGOUT
- LOGOUT_ALL_DEVICES
- REGISTER
- EMAIL_VERIFIED
- PASSWORD_CHANGED
- PASSWORD_RESET_REQUESTED
- PASSWORD_RESET_COMPLETED
- PROFILE_UPDATED
- ROLE_CHANGED
- ACCOUNT_LOCKED
- ACCOUNT_DELETED
- TOKEN_REFRESHED
- SESSION_REVOKED

---

## Admin Endpoints

### Get All Users

#### GET /api/users?page=1&limit=20&role=user&emailVerified=true

**Requires Admin Role**

Get list of all users with pagination and filtering.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `role`: Filter by role ('user' or 'admin')
- `emailVerified`: Filter by email verification status ('true' or 'false')

**Response (200):**

```json
{
  "success": true,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "emailVerified": true,
      "phone": "+1234567890",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

### Get User by ID

#### GET /api/users/:id

**Requires Admin Role**

Get specific user details by ID.

**Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "emailVerified": true,
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "zipCode": "10001"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Update User Role

#### PUT /api/users/:id/role

**Requires Admin Role**

Change user's role.

**Request Body:**

```json
{
  "role": "admin"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

**Note:** Users cannot change their own role.

**Error Responses:**

- 400: Invalid role
- 403: Cannot change own role

---

### Delete User

#### DELETE /api/users/:id

**Requires Admin Role**

Soft delete a user account.

**Response (200):**

```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

**Note:** Users cannot delete their own account. This is a soft delete - data is preserved but user cannot log in.

**Error Responses:**

- 403: Cannot delete own account
- 404: User not found

---

### Get User Audit Logs by ID

#### GET /api/users/:id/audit-logs?limit=50

**Requires Admin Role**

Get audit logs for specific user.

**Query Parameters:**

- `limit`: Number of logs to return (default: 50, max: 100)

**Response (200):**

```json
{
  "success": true,
  "logs": [
    {
      "_id": "log_id_1",
      "userId": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "action": "LOGIN_SUCCESS",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {},
      "success": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or validation error
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Security Features

### Password Requirements

- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot be common passwords

### Account Lockout

- Locks after 5 failed login attempts
- Lockout duration: 30 minutes
- Resets on successful login

### Rate Limiting

- Authentication endpoints: 5 requests / 15 minutes
- Password reset: 3 requests / hour
- Email verification resend: 3 requests / hour
- General API: 100 requests / 15 minutes

### Token Management

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh token rotation on use
- All tokens revoked on password reset

### Security Headers

- Helmet.js security headers
- CORS protection
- XSS protection
- MongoDB injection prevention
- Input sanitization

### Audit Logging

- All authentication events logged
- IP address tracking
- User agent tracking
- Timestamp recording
- Action metadata

---

## Environment Variables

```bash
# Server
PORT=5001
NODE_ENV=production

# Database
MONGO_URI=mongodb://localhost:27017/shopSphere

# JWT
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=15m

# Service URLs (for notifications)
NOTIFICATION_SERVICE_URL=http://notification-service:5004
```

---

## Development Mode Features

In development mode (`NODE_ENV=development`):

- Verification tokens returned in API responses
- Reset tokens returned in API responses
- Detailed error stacks in responses
- Console logging enabled

**⚠️ These features are disabled in production for security.**

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure MongoDB with authentication
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting with Redis
- [ ] Set up log aggregation
- [ ] Configure monitoring and alerts
- [ ] Set up automated backups
- [ ] Configure email service for notifications
- [ ] Review and adjust rate limits
- [ ] Enable CORS for specific origins only
- [ ] Set up reverse proxy (nginx)
- [ ] Configure firewall rules
- [ ] Set up DDoS protection

---

## Support

For issues or questions:

- GitHub Issues: <https://github.com/oyugijr/shop_sphere/issues>
- Documentation: See /docs folder
- Email: <support@shopsphere.com>
