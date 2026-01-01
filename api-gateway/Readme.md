# API Gateway Service

The API Gateway serves as the single entry point for all client requests to the ShopSphere microservices ecosystem.

## Overview

The API Gateway handles:
- **Request Routing**: Routes requests to appropriate microservices
- **Rate Limiting**: Protects against API abuse (100 requests/minute per IP)
- **CORS Configuration**: Manages cross-origin resource sharing
- **Security Headers**: Adds security headers to all responses
- **Request Logging**: Logs all incoming requests and responses
- **Health Checks**: Monitors gateway and service availability

## Architecture

```
Client → API Gateway → [User/Product/Order/Notification Services]
```

## Port

- **Default**: 3000
- **Configure via**: `API_GATEWAY_PORT` environment variable

## Routes

### Health Check
- **GET** `/health` - Check API Gateway health status

### User Service Routes
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login
- **GET** `/api/users/:id` - Get user profile
- **PUT** `/api/users/:id` - Update user profile

### Product Service Routes
- **GET** `/api/products` - List all products
- **GET** `/api/products/:id` - Get product details
- **POST** `/api/products` - Create product (auth required)
- **PUT** `/api/products/:id` - Update product (auth required)
- **DELETE** `/api/products/:id` - Delete product (auth required)

### Order Service Routes
- **POST** `/api/orders` - Create order (auth required)
- **GET** `/api/orders/:id` - Get order details (auth required)
- **GET** `/api/orders` - Get user orders (auth required)
- **PUT** `/api/orders/:id/status` - Update order status (admin only)

### Notification Service Routes
- **POST** `/api/notifications/send` - Send notification (auth required)
- **GET** `/api/notifications/:userId` - Get user notifications (auth required)

## Configuration

### Environment Variables

```env
# Port
PORT=3000

# Service URLs (Docker network)
USER_SERVICE_URL=http://user-service:5001
PRODUCT_SERVICE_URL=http://product-service:5002
ORDER_SERVICE_URL=http://order-service:5003
NOTIFICATION_SERVICE_URL=http://notification-service:5004

# Security
JWT_SECRET=your_jwt_secret_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Project Structure

```
api-gateway/
├── src/
│   ├── config/
│   │   └── services.js         # Service URL configuration
│   ├── middlewares/
│   │   ├── authMiddleware.js   # JWT authentication
│   │   ├── rateLimiter.js      # Rate limiting
│   │   ├── securityHeaders.js  # Security headers
│   │   ├── requestLogger.js    # Request logging
│   │   └── errorHandler.js     # Error handling
│   └── routes/
│       ├── userRoutes.js       # User service proxy routes
│       ├── productRoutes.js    # Product service proxy routes
│       ├── orderRoutes.js      # Order service proxy routes
│       └── notificationRoutes.js
├── app.js                       # Express application
├── Dockerfile                   # Docker configuration
└── package.json                 # Dependencies
```

## Middleware Stack

### 1. Security Headers
Adds security headers to all responses:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

### 2. Rate Limiting
Limits requests per IP:
- Default: 100 requests per minute
- Returns 429 status when exceeded

### 3. CORS
Configures cross-origin resource sharing:
- Configurable allowed origins
- Supports credentials
- Allowed methods: GET, POST, PUT, DELETE, PATCH

### 4. Request Logging
Logs all requests with:
- Method
- Path
- Status code
- Response time
- IP address

### 5. Authentication (Route-specific)
Validates JWT tokens on protected routes

### 6. Error Handling
Catches and formats all errors consistently

## Running Locally

### With Docker Compose
```bash
docker-compose up api-gateway
```

### Standalone
```bash
cd api-gateway
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

### Environment Setup
1. Copy `.env.example` to `.env`
2. Update service URLs for local development
3. Set JWT_SECRET

## Testing

### Manual Testing
```bash
# Check health
curl http://localhost:3000/health

# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Load Testing
Use tools like Apache Bench or k6:
```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io

# Run load test
k6 run load-test.js
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logs
```bash
# Docker
docker logs shopsphere-api-gateway -f

# Local
# Logs are written to console
```

## Security Considerations

1. **JWT Secret**: Always use a strong, random secret in production
2. **Rate Limiting**: Adjust based on your expected traffic
3. **CORS**: Configure allowed origins for production
4. **HTTPS**: Always use HTTPS in production
5. **API Keys**: Consider adding API key authentication for service-to-service calls

## Troubleshooting

### Service Not Routing
- Check service URLs in configuration
- Verify backend services are running
- Check Docker network connectivity

### Rate Limit Too Restrictive
- Increase `RATE_LIMIT_MAX_REQUESTS`
- Adjust `RATE_LIMIT_WINDOW_MS`
- Consider per-user rate limiting instead of per-IP

### CORS Errors
- Add frontend URL to `ALLOWED_ORIGINS`
- Ensure credentials are configured correctly
- Check HTTP methods are allowed

## Performance Tips

1. **Connection Pooling**: Maintain persistent connections to backend services
2. **Caching**: Add Redis caching for frequently accessed data
3. **Compression**: Enable gzip compression for responses
4. **Load Balancing**: Use multiple API Gateway instances behind a load balancer

## Dependencies

Main dependencies:
- `express` - Web framework
- `http-proxy-middleware` - Proxy middleware for routing
- `express-rate-limit` - Rate limiting
- `cors` - CORS middleware
- `jsonwebtoken` - JWT authentication
- `helmet` - Security headers

## Contributing

See the main [Contributing Guide](../CONTRIBUTING.md) for guidelines.

## Related Documentation

- [Main README](../README.md)
- [API Documentation](../docs/API.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)

---

**Maintained by**: ShopSphere Team
