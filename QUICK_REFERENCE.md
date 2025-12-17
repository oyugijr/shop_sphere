# ShopSphere - Quick Reference Guide

## Critical Issues Fixed ✅

### 1. Notification Service
- ✅ Created missing `queue.js` configuration file
- ✅ Added Redis container to `docker-compose.yml`
- ✅ Updated `.env.example` with Redis and Brevo configuration
- ✅ Initialized notification worker in `app.js`

## How to Get Started

### Quick Start (Docker)
```bash
# Clone the repository
git clone https://github.com/oyugijr/shop_sphere.git
cd shop_sphere

# Copy environment variables
cp .env.example .env

# Edit .env and add your configuration
# Required: JWT_SECRET, BREVO_API_KEY (for notifications)

# Start all services
docker-compose up -d

# Verify all services are running
curl http://localhost:3000/health
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
curl http://localhost:5004/health
```

### Local Development
```bash
# Install dependencies for each service
cd api-gateway && npm install && cd ..
cd user-service && npm install && cd ..
cd product-service && npm install && cd ..
cd order-service && npm install && cd ..
cd notification-service && npm install && cd ..

# Start MongoDB and Redis
docker-compose up -d mongodb redis

# Start services in separate terminals
cd user-service && npm run dev
cd product-service && npm run dev
cd order-service && npm run dev
cd notification-service && npm run dev
cd api-gateway && npm run dev
```

## What's Implemented

### ✅ Working Features
1. **User Management**
   - Registration (POST `/api/auth/register`)
   - Login (POST `/api/auth/login`)
   - Get profile (GET `/api/users/:id`)
   - JWT authentication
   - Role-based access control

2. **Product Management**
   - List products (GET `/api/products`)
   - Get product (GET `/api/products/:id`)
   - Create product (POST `/api/products`) - Auth required
   - Update product (PUT `/api/products/:id`) - Auth required
   - Delete product (DELETE `/api/products/:id`) - Auth required

3. **Order Management**
   - Create order (POST `/api/orders`) - Auth required
   - Get order (GET `/api/orders/:id`) - Auth required
   - Get user orders (GET `/api/orders`) - Auth required
   - Update status (PUT `/api/orders/:id/status`) - Admin only

4. **Notification Service**
   - Send notification (POST `/api/notifications/send`) - Auth required
   - Get notifications (GET `/api/notifications/:userId`) - Auth required
   - Mark as read (PATCH `/api/notifications/:id/read`) - Auth required

### ⚠️ Partially Implemented
1. **Testing** - Basic structure exists, needs implementation
2. **Search/Filtering** - Only basic listing available
3. **Error Handling** - Partially implemented across services

### ❌ Not Implemented
1. **Shopping Cart Service** - Critical missing feature
2. **Payment Service** - Critical missing feature
3. **Product Reviews & Ratings**
4. **Password Reset/Email Verification**
5. **Advanced Search (Elasticsearch)**
6. **CI/CD Pipeline**
7. **Kubernetes Deployment**
8. **Monitoring (Prometheus/Grafana)**
9. **API Documentation (Swagger)**

## Common Tasks

### Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

### Create a Product (Admin)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop with RTX 4080",
    "price": 1999.99,
    "category": "electronics",
    "stock": 15,
    "imageUrl": "https://example.com/laptop.jpg"
  }'
```

### Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "products": [
      {
        "product": "PRODUCT_ID_HERE",
        "quantity": 2
      }
    ],
    "totalPrice": 3999.98
  }'
```

### Send a Notification
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "email",
    "contact": "user@example.com",
    "message": "Your order has been confirmed!"
  }'
```

## Environment Variables Reference

### Required Variables
```env
# Critical - Must be set
JWT_SECRET=your_secure_secret_here
MONGO_URI=mongodb://mongodb:27017/shopSphere

# For Notifications (if using Brevo)
BREVO_API_KEY=your_brevo_api_key
```

### Optional Variables
```env
# Service Configuration
NODE_ENV=development
API_GATEWAY_PORT=3000
USER_SERVICE_PORT=5001
PRODUCT_SERVICE_PORT=5002
ORDER_SERVICE_PORT=5003
NOTIFICATION_SERVICE_PORT=5004

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Troubleshooting

### Service Won't Start
1. Check if MongoDB is running: `docker ps | grep mongo`
2. Check if Redis is running: `docker ps | grep redis`
3. Check logs: `docker logs shopsphere-[service-name]`
4. Verify environment variables are set

### Can't Connect to Services
1. Verify all containers are running: `docker-compose ps`
2. Check network connectivity: `docker network inspect shopsphere-network`
3. Verify ports are not already in use: `netstat -an | grep [PORT]`

### Notification Service Issues
1. Verify Redis is running and accessible
2. Check BREVO_API_KEY is set correctly
3. Check worker logs: `docker logs shopsphere-notification-service`

### Database Connection Issues
1. Verify MONGO_URI is correct
2. Check MongoDB container is running
3. Test connection: `docker exec -it shopsphere-mongo mongosh`

## Next Steps for Development

### Priority 1: Critical Features
1. Implement Shopping Cart Service
   - Create new microservice
   - Add cart model
   - Implement cart CRUD operations
   - Integrate with order service

2. Implement Payment Service
   - Create payment microservice
   - Integrate Stripe/PayPal
   - Add transaction tracking
   - Link with order service

### Priority 2: Enhance Existing Features
1. Add Product Search & Filtering
   - Add query parameters to product endpoints
   - Implement pagination
   - Add category filtering
   - Add price range filtering

2. Complete Testing
   - Write unit tests for all services
   - Add integration tests
   - Implement E2E tests
   - Add CI/CD with automated testing

### Priority 3: Production Readiness
1. Add Monitoring
   - Implement Prometheus metrics
   - Create Grafana dashboards
   - Add logging aggregation

2. Security Enhancements
   - Add API key management
   - Implement request signing
   - Add security scanning

3. Documentation
   - Add Swagger/OpenAPI specs
   - Create API versioning
   - Add deployment guides

## Additional Resources

- **Full Documentation:** See `/docs` folder
- **Architecture:** See `ARCHITECTURE.md`
- **API Reference:** See `API.md`
- **Setup Guide:** See `SETUP.md`
- **Implementation Status:** See `IMPLEMENTATION_STATUS.md`
- **Contributing:** See `CONTRIBUTING.md`

## Support

For issues and questions:
1. Check the documentation in `/docs`
2. Review `IMPLEMENTATION_STATUS.md` for known issues
3. Check existing GitHub issues
4. Create a new issue with detailed information

---

**Last Updated:** December 17, 2024  
**Version:** 1.0.0  
**Status:** Development - Not Production Ready
