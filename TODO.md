# ShopSphere - Project TODO List

This document outlines all pending tasks, bugs, and improvements needed for the ShopSphere microservices project.

## 🔴 Critical Bugs (Must Fix Immediately)

### API Gateway
- [ ] **Bug**: `orderRoute` variable is used but not defined (line 17 in `api-gateway/app.js`)
  - Error: `ReferenceError: orderRoute is not defined`
  - Need to create `api-gateway/src/routes/orderRoutes.js`
  - Need to import it: `const orderRoutes = require("./src/routes/orderRoutes");`

### Product Service
- [ ] **Bug**: Routes file imports wrong controller name
  - File: `product-service/src/routes/product.routes.js` (line 2)
  - Imports from: `../controllers/productController` (doesn't exist)
  - Should import from: `../controllers/product.controller.js`

### Order Service
- [ ] **Bug**: Wrong database module import in app.js
  - File: `order-service/app.js` (line 3)
  - Currently: `const mongoose = require("./config/db");`
  - Should be: `const connectDB = require("./config/db");`
  - Missing call to `connectDB()` to establish connection

### Docker Configuration
- [ ] **Bug**: Port conflict - notification-service and order-service both use port 5003
  - notification-service should use port 5004
  - Update in: `notification-service/app.js`, `notification-service/Dockerfile`, `docker-compose.yml`
- [ ] **Missing**: notification-service not added to `docker-compose.yml`
- [ ] **Bug**: user-service Dockerfile exposes wrong port (5000 instead of 5001)

### Configuration Security
- [ ] **Security Issue**: MongoDB credentials exposed in `docker-compose.yml`
  - Move to environment variables
  - Create `.env.example` file
  - Update documentation

## 🟡 Missing Core Features

### Payment Service
- [ ] Create `payment-service/` directory structure
- [ ] Implement payment processing (Stripe integration as mentioned in README)
- [ ] Create payment models (Transaction, PaymentMethod)
- [ ] Implement payment routes and controllers
- [ ] Add payment service to docker-compose.yml
- [ ] Integrate with order-service

### Shared Libraries
- [ ] Create `shared-libs/` directory
- [ ] Implement common DTOs (Data Transfer Objects)
- [ ] Create utility functions (validation, formatting, etc.)
- [ ] Add common middleware (error handling, logging)
- [ ] Set up as npm workspace or separate package

### Infrastructure
- [ ] Create `infra/` directory
- [ ] Add database migration scripts
- [ ] Create backup and restore scripts
- [ ] Add monitoring setup (Prometheus/Grafana)
- [ ] Create deployment scripts
- [ ] Add CI/CD pipeline configuration

### Documentation
- [ ] Create `docs/` directory
- [ ] Write API documentation for each service
  - [ ] API Gateway
  - [ ] User Service
  - [ ] Product Service
  - [ ] Order Service
  - [ ] Notification Service
  - [ ] Payment Service
- [ ] Create architecture diagrams
- [ ] Write deployment guide
- [ ] Create development setup guide
- [ ] Add troubleshooting guide

## 🔵 Configuration & Setup Issues

### Package.json Scripts
- [ ] Add `start` script to all services (currently missing in several)
  - [ ] api-gateway: needs `"start": "node app.js"`
  - [ ] product-service: needs start script
  - [ ] order-service: needs start script
  - [ ] notification-service: needs start script
- [ ] Add `dev` script with nodemon for development
- [ ] Configure proper test scripts (currently all have placeholder "Error: no test specified")

### Git Configuration
- [ ] Create root `.gitignore` file
  - Add: `node_modules/`, `.env`, `*.log`, `.DS_Store`, `dist/`, `coverage/`
- [ ] Ensure `.env` files are not committed (they currently exist in repo)
- [ ] Create `.env.example` files for each service

### Environment Variables
- [ ] Create `.env.example` for each service
- [ ] Document required environment variables
- [ ] Remove hardcoded MongoDB URI from docker-compose.yml
- [ ] Add JWT secret configuration
- [ ] Add email service configuration (for notification-service)

## 🟢 Testing Infrastructure

### Test Setup
- [ ] Configure Jest properly in all services
- [ ] Add test database configuration (mongodb-memory-server)
- [ ] Create test utilities and helpers
- [ ] Add code coverage reporting
- [ ] Set up CI/CD for automated testing

### Test Files
- [ ] Complete unit tests for user-service
  - Existing: `authService.test.js`, `userService.test.js`
- [ ] Complete unit tests for product-service
  - Existing: `productService.test.js`
- [ ] Complete unit tests for order-service
  - Existing: `orderService.test.js`
- [ ] Complete unit tests for notification-service
  - Existing: `notificationService.test.js`
- [ ] Add integration tests for API Gateway
- [ ] Add end-to-end tests

## 🟣 Enhancements & Best Practices

### API Improvements
- [ ] Add health check endpoints (`/health` or `/api/health`) to all services
- [ ] Implement proper error handling middleware
- [ ] Add request validation using Joi or express-validator
- [ ] Implement request logging (Morgan is installed but not consistently used)
- [ ] Add response formatting middleware
- [ ] Implement pagination for list endpoints
- [ ] Add filtering and sorting capabilities

### Security
- [ ] Implement rate limiting in API Gateway
- [ ] Add CORS configuration (properly configured, not just `cors()`)
- [ ] Implement API key authentication for service-to-service communication
- [ ] Add request sanitization
- [ ] Implement HTTPS in production
- [ ] Add helmet.js for security headers
- [ ] Implement refresh token mechanism

### Code Quality
- [ ] Add ESLint configuration
- [ ] Add Prettier for code formatting
- [ ] Implement consistent error handling patterns
- [ ] Add JSDoc comments for functions
- [ ] Remove commented-out code from controllers
- [ ] Standardize response formats across services
- [ ] Implement dependency injection

### Database
- [ ] Add database indexes for frequently queried fields
- [ ] Implement database migrations
- [ ] Add database seeding scripts
- [ ] Consider adding Redis for caching
- [ ] Implement database connection pooling
- [ ] Add database health checks

### Service Communication
- [ ] Implement service discovery (Consul or similar)
- [ ] Add circuit breaker pattern
- [ ] Implement retry logic with exponential backoff
- [ ] Add service mesh consideration (Istio/Linkerd)
- [ ] Implement event-driven communication (RabbitMQ/Kafka)

### Monitoring & Observability
- [ ] Add structured logging (Winston or Pino)
- [ ] Implement distributed tracing (Jaeger/Zipkin)
- [ ] Add metrics collection (Prometheus)
- [ ] Create Grafana dashboards
- [ ] Implement alerting rules
- [ ] Add performance monitoring (APM)

### DevOps
- [ ] Add Docker Compose for development vs production
- [ ] Create Kubernetes manifests
- [ ] Add horizontal pod autoscaling
- [ ] Implement blue-green deployment
- [ ] Add container health checks
- [ ] Create backup strategies

## 📋 Service-Specific TODOs

### API Gateway
- [ ] Implement authentication middleware
- [ ] Add request routing validation
- [ ] Implement load balancing strategy
- [ ] Add request/response transformation
- [ ] Implement API versioning

### User Service
- [ ] Add password reset functionality
- [ ] Implement email verification
- [ ] Add user profile image upload
- [ ] Implement user roles and permissions
- [ ] Add account deactivation/deletion

### Product Service
- [ ] Add product categories
- [ ] Implement product search functionality
- [ ] Add product images support
- [ ] Implement inventory tracking
- [ ] Add product reviews and ratings
- [ ] Implement product variants (size, color, etc.)

### Order Service
- [ ] Implement order workflow (pending, processing, shipped, delivered, cancelled)
- [ ] Add order history
- [ ] Implement order cancellation
- [ ] Add order tracking
- [ ] Implement partial refunds

### Notification Service
- [ ] Implement email templates
- [ ] Add SMS notification support
- [ ] Implement push notifications
- [ ] Add notification preferences
- [ ] Implement notification scheduling
- [ ] Add notification history

### Payment Service (To Be Created)
- [ ] Set up Stripe integration
- [ ] Implement payment processing
- [ ] Add refund functionality
- [ ] Implement payment webhooks
- [ ] Add multiple payment methods support
- [ ] Implement payment history
- [ ] Add transaction security

## 🔄 Maintenance Tasks
- [ ] Update all dependencies to latest stable versions
- [ ] Remove unused dependencies
- [ ] Audit security vulnerabilities (`npm audit`)
- [ ] Clean up commented code
- [ ] Standardize code style across services
- [ ] Update README with current state
- [ ] Create CONTRIBUTING.md
- [ ] Add LICENSE file

## Priority Ranking

### P0 (Critical - Do First)
1. Fix orderRoute bug in API Gateway
2. Fix product-service controller import
3. Fix order-service database connection
4. Fix port conflicts
5. Add notification-service to docker-compose.yml
6. Create root .gitignore
7. Secure MongoDB credentials

### P1 (High Priority)
1. Add missing npm start scripts
2. Create payment-service basic structure
3. Add health check endpoints
4. Configure proper testing infrastructure
5. Create API documentation

### P2 (Medium Priority)
1. Implement shared libraries
2. Add proper error handling
3. Implement request validation
4. Add monitoring and logging
5. Create infrastructure scripts

### P3 (Low Priority - Nice to Have)
1. Add advanced features (search, filters, etc.)
2. Implement service mesh
3. Add performance optimizations
4. Create advanced monitoring dashboards

---

**Last Updated**: 2025-12-11

**Note**: This is a living document. Update it as tasks are completed or new requirements emerge.
