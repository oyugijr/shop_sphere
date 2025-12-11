# ShopSphere - Quick Start Guide

## ⚠️ IMPORTANT: Known Issues

**This project currently has critical bugs that prevent it from running. Please see TODO.md for the complete list.**

### Critical Bugs to Fix First:
1. API Gateway: `orderRoute` is not defined
2. Product Service: Wrong controller import path
3. Order Service: Wrong database module import
4. Port conflicts between services
5. Notification service not in docker-compose.yml

## Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB Atlas account (or local MongoDB)
- Git

## Project Structure

```
shop_sphere/
├── api-gateway/          # Entry point, routes to services
├── user-service/         # User authentication & management
├── product-service/      # Product catalog management
├── order-service/        # Order processing
├── notification-service/ # Email/SMS notifications
├── docker-compose.yml    # Docker orchestration
├── TODO.md              # Complete task list
├── PROJECT_STATUS.md    # Project overview
└── QUICKSTART.md        # This file
```

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/oyugijr/shop_sphere.git
cd shop_sphere
```

### 2. Environment Variables

Each service needs its own `.env` file. Create them based on these templates:

#### api-gateway/.env
```env
PORT=3000
USER_SERVICE_URL=http://user-service:5001
PRODUCT_SERVICE_URL=http://product-service:5002
ORDER_SERVICE_URL=http://order-service:5003
NOTIFICATION_SERVICE_URL=http://notification-service:5004
```

#### user-service/.env
```env
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopSphere
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=24h
```

#### product-service/.env
```env
PORT=5002
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopSphere
```

#### order-service/.env
```env
PORT=5003
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopSphere
```

#### notification-service/.env
```env
PORT=5004
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopSphere
REDIS_HOST=redis
REDIS_PORT=6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Running with Docker (Recommended)

### Start All Services

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### Check Service Status

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs

# View specific service logs
docker-compose logs user-service
docker-compose logs -f product-service  # Follow mode
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Running Locally (Development)

### Install Dependencies

```bash
# Install for all services
cd api-gateway && npm install && cd ..
cd user-service && npm install && cd ..
cd product-service && npm install && cd ..
cd order-service && npm install && cd ..
cd notification-service && npm install && cd ..
```

### Start Each Service

Open separate terminal windows/tabs:

```bash
# Terminal 1 - API Gateway
cd api-gateway
npm start

# Terminal 2 - User Service
cd user-service
npm start

# Terminal 3 - Product Service
cd product-service
npm start

# Terminal 4 - Order Service
cd order-service
npm start

# Terminal 5 - Notification Service
cd notification-service
npm start
```

## Service Endpoints

### API Gateway (Port 3000)
Base URL: `http://localhost:3000`

### User Service (Port 5001)
```bash
# Register
POST http://localhost:5001/api/auth/register
Content-Type: application/json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

# Login
POST http://localhost:5001/api/auth/login
Content-Type: application/json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Product Service (Port 5002)
```bash
# Get all products
GET http://localhost:5002/api/products

# Create product (requires auth token)
POST http://localhost:5002/api/products
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "Electronics",
  "stock": 100
}
```

### Order Service (Port 5003)
```bash
# Create order (requires auth token)
POST http://localhost:5003/api/orders
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
{
  "products": [
    {
      "productId": "product-id-here",
      "quantity": 2
    }
  ],
  "shippingAddress": "123 Main St, City, Country"
}
```

## Testing the API

### Using cURL

```bash
# Register a user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get products
curl http://localhost:5002/api/products
```

### Using Postman/Insomnia

1. Import the endpoints listed above
2. Register a new user
3. Login and copy the JWT token
4. Add token to Authorization header: `Bearer <token>`
5. Make authenticated requests

## Database Access

### MongoDB Atlas
- Dashboard: https://cloud.mongodb.com/
- Current URI in docker-compose.yml (needs to be moved to .env)

### Mongo Express (Web UI)
- URL: http://localhost:8081
- Automatically configured in docker-compose.yml

## Troubleshooting

### Services Won't Start
- Check if ports are already in use: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)
- Verify .env files exist and have correct values
- Check Docker logs: `docker-compose logs`

### Database Connection Errors
- Verify MongoDB URI is correct
- Check MongoDB Atlas allows connections from your IP
- Ensure database user has proper permissions

### Authentication Issues
- Verify JWT_SECRET is set in user-service/.env
- Check token is included in Authorization header
- Token format: `Bearer <token>`

### Port Conflicts
- Current known issue: notification-service and order-service both use 5003
- Temporary fix: Change notification-service port to 5004

## Development Tools

### Recommended VS Code Extensions
- ESLint
- Prettier
- Docker
- REST Client or Thunder Client
- GitLens

### Useful Commands

```bash
# View Docker container logs
docker logs <container-name>

# Execute command in container
docker exec -it <container-name> sh

# Restart a specific service
docker-compose restart user-service

# Rebuild specific service
docker-compose up -d --build user-service

# View MongoDB data
docker exec -it shopsphere-mongo mongosh
```

## Running Tests

```bash
# Currently broken - needs configuration
npm test  # In each service directory
```

## Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit: `git commit -m "Description of changes"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## Getting Help

- Check TODO.md for known issues
- Review PROJECT_STATUS.md for current state
- Check service logs for errors
- Ensure all environment variables are set

## Next Steps After Setup

1. Fix the critical bugs listed in TODO.md
2. Test each service endpoint
3. Implement missing payment-service
4. Add proper error handling
5. Write tests
6. Add monitoring

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution**: Check MONGO_URI in .env files, ensure MongoDB Atlas allows your IP

### Issue: "Port already in use"
**Solution**: Kill the process using the port or change the port in .env

### Issue: "orderRoute is not defined"
**Solution**: This is a known bug, see TODO.md P0 issues

### Issue: "Authentication failed"
**Solution**: Ensure JWT_SECRET is set and token is valid

### Issue: Docker build fails
**Solution**: Clear Docker cache: `docker system prune -a`

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-11  
**Status**: ⚠️ Project has critical bugs, not ready for production use
