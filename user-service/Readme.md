# User Service

The User Service handles user authentication, registration, and profile management for ShopSphere.

## Overview

The User Service provides:
- **User Registration**: Create new user accounts with email validation
- **User Authentication**: JWT-based login system
- **Profile Management**: Update user information and preferences
- **Password Security**: Bcrypt password hashing
- **Role-Based Access**: User and admin roles

## Port

- **Default**: 5001
- **Configure via**: `USER_SERVICE_PORT` environment variable

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### User Management

#### Get User Profile
```http
GET /api/users/:id
Authorization: Bearer {token}
```

#### Update User Profile
```http
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "profile": {
    "phone": "555-1234",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  }
}
```

#### Health Check
```http
GET /health
```

## Database Schema

### User Model

```javascript
{
  name: String,           // Required, max 100 chars
  email: String,          // Required, unique, lowercase
  password: String,       // Required, hashed, min 8 chars
  role: String,           // 'user' or 'admin', default: 'user'
  isActive: Boolean,      // Default: true
  lastLogin: Date,
  profile: {
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    avatar: String
  },
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

### Indexes

- `email`: Unique index
- `role`: Index for role-based queries
- `createdAt`: Index for sorting

## Configuration

### Environment Variables

```env
# Port
PORT=5001

# Database
MONGO_URI=mongodb://mongodb:27017/shopSphere

# JWT
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d

# Node Environment
NODE_ENV=production
```

## Project Structure

```
user-service/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── controllers/
│   │   ├── authController.js    # Auth endpoints
│   │   └── userController.js    # User CRUD
│   ├── models/
│   │   └── User.js              # User schema
│   ├── routes/
│   │   ├── authRoutes.js        # Auth routes
│   │   └── userRoutes.js        # User routes
│   ├── services/
│   │   ├── authService.js       # Auth business logic
│   │   └── userService.js       # User business logic
│   ├── middlewares/
│   │   └── authMiddleware.js    # JWT validation
│   └── utils/
│       ├── generateToken.js     # JWT generation
│       ├── hashPassword.js      # Password hashing
│       └── validation.js        # Input validation
├── tests/                       # Test files
├── app.js                       # Express application
├── Dockerfile
└── package.json
```

## Security Features

### Password Security
- Passwords hashed with bcryptjs (10 salt rounds)
- Never stored in plain text
- Not returned in API responses

### JWT Tokens
- Signed with HS256 algorithm
- 7-day expiration by default
- Include user ID and role

### Input Validation
- Email format validation
- Password strength requirements
- Sanitization of user inputs

## Running Locally

### With Docker Compose
```bash
docker-compose up user-service
```

### Standalone
```bash
cd user-service
npm install
npm start
```

## Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
npm run test:coverage
```

## Testing

### Unit Tests
```bash
npm test
```

### Manual Testing
```bash
# Register a user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123456"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'

# Get profile (with token from login)
curl http://localhost:5001/api/users/{user_id} \
  -H "Authorization: Bearer {token}"
```

## Error Handling

### Common Error Codes

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid token
- **404 Not Found**: User not found
- **409 Conflict**: Email already exists
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Monitoring

### Health Check
```bash
curl http://localhost:5001/health
```

### Logs
```bash
# Docker
docker logs shopsphere-user-service -f

# Local
# Logs are written to console
```

## Troubleshooting

### Cannot Connect to Database
- Verify MongoDB is running
- Check `MONGO_URI` in environment variables
- Ensure Docker network connectivity

### Token Verification Fails
- Ensure JWT_SECRET is consistent across services
- Check token format: `Bearer {token}`
- Verify token hasn't expired

### Password Validation Fails
- Minimum 8 characters required
- Check for special characters if enforced

## Performance Optimization

1. **Connection Pooling**: Configure Mongoose pool size
2. **Indexes**: Email, role, and createdAt are indexed
3. **Lean Queries**: Use `.lean()` for read-only operations
4. **Caching**: Consider Redis for session management

## Dependencies

Main dependencies:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `validator` - Input validation

## Contributing

See the main [Contributing Guide](../CONTRIBUTING.md) for guidelines.

## Related Documentation

- [Main README](../README.md)
- [API Documentation](../docs/API.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Security Best Practices](../docs/SECURITY.md)

---

**Maintained by**: ShopSphere Team
