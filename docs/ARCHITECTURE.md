# ShopSphere Architecture

## Overview

ShopSphere is a microservices-based e-commerce platform designed for scalability, maintainability, and fault tolerance. Each service is independently deployable and communicates through well-defined APIs.

## System Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   API Gateway   │
                                    │    (Port 3000)  │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
          ┌─────────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
          │  User Service    │    │ Product Service  │    │  Order Service   │
          │   (Port 5001)    │    │   (Port 5002)    │    │   (Port 5003)    │
          └─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
                    │                        │                        │
                    └────────────────────────┼────────────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  Notification   │
                                    │    Service      │
                                    │  (Port 5004)    │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┴────────────────────────┐
                    │                                                  │
          ┌─────────▼────────┐                              ┌─────────▼────────┐
          │    MongoDB       │                              │   Redis (Queue)  │
          │  (Port 27017)    │                              │                  │
          └──────────────────┘                              └──────────────────┘
```

## Service Descriptions

### 1. API Gateway
**Technology**: Node.js, Express, HTTP Proxy Middleware

**Responsibilities**:
- Single entry point for all client requests
- Request routing to appropriate microservices
- Rate limiting and throttling
- CORS configuration
- Request/response logging
- Error handling

**Key Features**:
- Health check endpoint
- Rate limiting (100 requests/minute per IP)
- Centralized error handling
- Request logging

### 2. User Service
**Technology**: Node.js, Express, MongoDB, JWT

**Responsibilities**:
- User registration and authentication
- User profile management
- JWT token generation and validation
- Password hashing and verification

**Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

**Database Schema**:
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Product Service
**Technology**: Node.js, Express, MongoDB

**Responsibilities**:
- Product catalog management
- Inventory tracking
- Product CRUD operations
- Product search and filtering

**Endpoints**:
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (auth required)
- `PUT /api/products/:id` - Update product (auth required)
- `DELETE /api/products/:id` - Delete product (auth required)

**Database Schema**:
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,
  imageUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Order Service
**Technology**: Node.js, Express, MongoDB

**Responsibilities**:
- Order creation and management
- Order status tracking
- Order history
- Integration with product service for inventory

**Endpoints**:
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders` - Get user orders
- `PUT /api/orders/:id/status` - Update order status (admin)

**Database Schema**:
```javascript
{
  userId: ObjectId,
  items: [{
    productId: ObjectId,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: String (pending/processing/shipped/delivered/cancelled),
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Notification Service
**Technology**: Node.js, Express, MongoDB, Bull (Queue), Redis

**Responsibilities**:
- Email notifications
- Push notifications
- Notification history
- Asynchronous notification processing

**Endpoints**:
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications/:userId` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read

**Database Schema**:
```javascript
{
  userId: ObjectId,
  type: String (email/push/sms),
  subject: String,
  message: String,
  read: Boolean,
  sentAt: Date,
  createdAt: Date
}
```

### 6. Cart Service
**Technology**: Node.js, Express, MongoDB, Axios

**Responsibilities**:
- Shopping cart management for users
- Add/remove/update cart items
- Real-time product stock validation
- Calculate cart totals and subtotals
- Integration with Product Service for validation

**Endpoints**:
- `GET /api/cart` - Get user's cart (auth required)
- `POST /api/cart/items` - Add item to cart (auth required)
- `PUT /api/cart/items/:productId` - Update item quantity (auth required)
- `DELETE /api/cart/items/:productId` - Remove item from cart (auth required)
- `DELETE /api/cart` - Clear cart (auth required)

**Database Schema**:
```javascript
{
  userId: ObjectId (unique, indexed),
  items: [
    {
      productId: ObjectId,
      name: String,
      price: Number,
      quantity: Number,
      subtotal: Number
    }
  ],
  totalPrice: Number,
  totalItems: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features**:
- One cart per user (userId is unique)
- Automatic total calculation with pre-save hooks
- Product validation before adding to cart
- Stock level checking via Product Service
- No duplicate products in cart
- Comprehensive error handling

## Data Flow Examples

### User Registration Flow
1. Client sends POST request to API Gateway (`/api/auth/register`)
2. API Gateway routes request to User Service
3. User Service validates input and hashes password
4. User data stored in MongoDB
5. JWT token generated and returned to client
6. Notification Service sends welcome email (async)

### Order Creation Flow
1. Client sends POST request with order details to API Gateway
2. API Gateway routes to Order Service
3. Order Service validates user authentication
4. Order Service checks product availability (Product Service)
5. Order created in database
6. Notification Service sends order confirmation email
7. Product Service updates inventory

### Product Search Flow
1. Client sends GET request with search parameters
2. API Gateway routes to Product Service
3. Product Service queries MongoDB with filters
4. Results returned through API Gateway to client

### Cart Management Flow
1. Client sends POST request to add item to cart via API Gateway
2. API Gateway routes to Cart Service
3. Cart Service validates user authentication (JWT)
4. Cart Service calls Product Service to validate product and check stock
5. If validation passes, item is added to cart
6. Cart totals are automatically calculated
7. Updated cart returned to client
8. If stock insufficient or product not found, error returned

## Communication Patterns

### Synchronous Communication
- HTTP/REST APIs between services
- Used for immediate responses (CRUD operations)

### Asynchronous Communication
- Message queue (Bull + Redis) for notifications
- Used for non-blocking operations

## Security

### Authentication
- JWT-based authentication
- Tokens generated on login
- Middleware validates tokens on protected routes

### Authorization
- Role-based access control (RBAC)
- Admin-only routes for sensitive operations
- User can only access their own data

### Data Protection
- Password hashing with bcryptjs
- Environment variables for secrets
- CORS configuration
- Rate limiting

## Database Design

### MongoDB Collections
- `users` - User accounts and profiles
- `products` - Product catalog
- `orders` - Order records
- `carts` - Shopping carts (one per user)
- `notifications` - Notification history

### Indexes
- User email (unique)
- Product category
- Order userId
- Cart userId (unique)
- Timestamps for sorting

## Scalability Considerations

### Horizontal Scaling
- Each microservice can be scaled independently
- Stateless services enable easy replication
- Load balancing at API Gateway level

### Caching Strategy
- Product catalog caching
- User session caching
- Redis for distributed caching

### Database Optimization
- Indexed queries
- Connection pooling
- Read replicas for scaling reads

## Monitoring and Observability

### Health Checks
All services expose `/health` endpoint for:
- Container orchestration (Kubernetes health probes)
- Load balancer health checks
- Monitoring systems

### Logging
- Structured logging in all services
- Request/response logging in API Gateway
- Error tracking and alerting

### Metrics (Future)
- Request latency
- Error rates
- Service availability
- Database query performance

## Deployment

### Containerization
- Each service has its own Dockerfile
- Docker Compose for local development
- Kubernetes-ready architecture

### CI/CD Pipeline (Recommended)
1. Code commit triggers build
2. Run tests and linting
3. Build Docker images
4. Push to container registry
5. Deploy to staging environment
6. Run integration tests
7. Deploy to production

## Future Enhancements

1. ~~**Payment Service**: Integration with payment gateways~~ ✅ IMPLEMENTED
2. **Search Service**: Elasticsearch for advanced product search
3. **Analytics Service**: Business intelligence and reporting
4. **Image Service**: Image processing and CDN integration
5. **Review Service**: Product reviews and ratings
6. ~~**Cart Service**: Shopping cart management~~ ✅ IMPLEMENTED
7. **API Documentation**: Swagger/OpenAPI integration
8. **Service Mesh**: Istio for advanced traffic management
