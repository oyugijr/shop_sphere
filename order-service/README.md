# Order Service - Production Ready

A production-ready order management microservice for ShopSphere e-commerce platform with comprehensive features including order processing, payment tracking, and order history management.

## Features

✅ **Complete Order Management**
- Create orders with comprehensive validation
- Real-time order status tracking
- Order cancellation with audit trail
- Order history and status transitions
- Pagination and filtering support

✅ **Payment Integration**
- Payment status tracking
- Support for multiple payment methods (Stripe, M-Pesa, PayPal, Cash on Delivery)
- Payment ID linkage
- Automatic payment status updates

✅ **Security & Authorization**
- JWT authentication
- Role-based access control (User/Admin)
- Input validation and sanitization
- Protection against XSS attacks

✅ **Production-Ready Features**
- Comprehensive error handling
- Request logging
- Health check endpoint
- Graceful shutdown
- CORS configuration
- MongoDB indexes for performance

✅ **Integration with Other Services**
- Product service integration for stock validation
- Payment service integration for payment tracking
- Service-to-service authentication

✅ **Order Statistics**
- Total orders and revenue
- Status-wise order breakdown
- User-specific and system-wide statistics

## API Endpoints

### User Endpoints

#### Create Order
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 99.99,
      "name": "Product Name"
    }
  ],
  "totalPrice": 199.98,
  "shippingAddress": {
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "stripe",
  "notes": "Please deliver in the morning"
}

Response:
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1703000000000-123",
    "user": "user_id",
    "items": [...],
    "totalPrice": 199.98,
    "shippingAddress": {...},
    "status": "pending",
    "paymentStatus": "pending",
    "history": [...],
    "createdAt": "2024-12-23T10:00:00.000Z"
  }
}
```

#### Get My Orders
```bash
GET /api/orders/my-orders?page=1&limit=10&status=pending
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [...orders],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Order by ID
```bash
GET /api/orders/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1703000000000-123",
    "user": {...},
    "items": [...],
    "totalPrice": 199.98,
    "shippingAddress": {...},
    "status": "pending",
    "paymentStatus": "pending",
    "history": [...]
  }
}
```

#### Get Order by Order Number
```bash
GET /api/orders/order-number/:orderNumber
Authorization: Bearer <token>
```

#### Get Order Statistics
```bash
GET /api/orders/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalOrders": 45,
    "totalRevenue": 4599.55,
    "pendingOrders": 5,
    "processingOrders": 10,
    "shippedOrders": 15,
    "deliveredOrders": 10,
    "cancelledOrders": 5
  }
}
```

#### Cancel Order
```bash
POST /api/orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Changed my mind about the purchase"
}

Response:
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "_id": "order_id",
    "status": "cancelled",
    "cancelReason": "Changed my mind about the purchase",
    "cancelledAt": "2024-12-23T10:30:00.000Z",
    "cancelledBy": "user_id"
  }
}
```

### Admin Endpoints

#### Get All Orders
```bash
GET /api/orders?page=1&limit=10&status=pending&paymentStatus=completed
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": [...orders],
  "pagination": {...}
}
```

#### Update Order Status
```bash
PUT /api/orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped",
  "note": "Order shipped via FedEx, Tracking: 1234567890"
}

Response:
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "_id": "order_id",
    "status": "shipped",
    "history": [...]
  }
}
```

#### Update Payment Status
```bash
PUT /api/orders/:id/payment-status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "paymentStatus": "completed",
  "paymentId": "pi_1234567890",
  "paymentMethod": "stripe"
}

Response:
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "_id": "order_id",
    "paymentStatus": "completed",
    "paymentId": "pi_1234567890"
  }
}
```

### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "order-service",
  "timestamp": "2024-12-23T10:00:00.000Z",
  "uptime": 3600
}
```

## Order Model

```javascript
{
  orderNumber: String,           // Auto-generated: ORD-{timestamp}-{random}
  user: ObjectId,                // Reference to User
  items: [
    {
      product: ObjectId,         // Reference to Product
      quantity: Number,          // Min: 1
      price: Number,             // Price at time of order
      name: String,              // Product name
      subtotal: Number           // quantity * price
    }
  ],
  totalPrice: Number,            // Sum of all subtotals
  shippingAddress: {
    fullName: String,
    phoneNumber: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  status: String,                // pending, processing, shipped, delivered, cancelled
  paymentStatus: String,         // pending, processing, completed, failed, refunded
  paymentMethod: String,         // stripe, mpesa, paypal, cash_on_delivery
  paymentId: String,             // Payment transaction ID
  history: [
    {
      status: String,
      timestamp: Date,
      note: String,
      updatedBy: ObjectId        // User who made the update
    }
  ],
  notes: String,                 // Customer notes
  cancelReason: String,          // Reason for cancellation
  cancelledAt: Date,
  cancelledBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Order Status Flow

```
pending → processing → shipped → delivered
   ↓
cancelled (only from pending/processing)
```

## Payment Status Flow

```
pending → processing → completed
   ↓          ↓
 failed    refunded
```

## Validation Rules

### Order Creation
- At least one item required
- Each item must have valid productId, quantity (>= 1), price (>= 0), and name
- Total price must be > 0
- Complete shipping address required
  - Full name (min 2 chars)
  - Phone number (min 10 chars)
  - Street address (min 5 chars)
  - City (min 2 chars)
  - State (min 2 chars)
  - Zip code (min 3 chars)
  - Country (min 2 chars)

### Status Updates
- Valid statuses: pending, processing, shipped, delivered, cancelled
- Valid payment statuses: pending, processing, completed, failed, refunded
- Valid payment methods: stripe, mpesa, paypal, cash_on_delivery

### Cancellation Rules
- Can only cancel orders in 'pending' or 'processing' status
- Cannot cancel if payment status is 'completed'
- Cancellation reason is required

## Security Features

- ✅ JWT authentication for all routes
- ✅ Role-based access control (admin-only routes)
- ✅ Input validation and sanitization
- ✅ XSS protection
- ✅ Protection against SQL injection
- ✅ CORS configuration
- ✅ Secure error handling (no stack traces in production)

## Environment Variables

```env
# MongoDB
MONGO_URI=mongodb://mongodb:27017/shopSphere

# JWT
JWT_SECRET=your_jwt_secret_here

# Server
PORT=5003
NODE_ENV=production

# Service URLs
PRODUCT_SERVICE_URL=http://product-service:5002
PAYMENT_SERVICE_URL=http://payment-service:5005

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run in development
npm run dev

# Run in production
npm start

# Run tests
npm test
```

## Testing

The service includes comprehensive integration tests with real database interactions (no mocks):

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/integration.test.js
```

Test coverage includes:
- ✅ Order creation with validation
- ✅ Authentication and authorization
- ✅ Order retrieval (by ID, order number, user orders)
- ✅ Pagination and filtering
- ✅ Order status updates
- ✅ Payment status updates
- ✅ Order cancellation
- ✅ Order statistics
- ✅ Error handling

## Docker Support

```bash
# Build Docker image
docker build -t order-service .

# Run with Docker Compose
docker-compose up order-service
```

## Integration with Other Services

### Product Service
- Validates product availability before order creation
- Checks stock levels
- Retrieves product details

### Payment Service
- Links orders with payment transactions
- Tracks payment status
- Supports payment status updates

## Logging

The service logs:
- Order creation events
- Order status changes
- Payment status updates
- Order cancellations
- Errors and exceptions
- Authentication failures

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Performance Optimizations

- ✅ MongoDB indexes on frequently queried fields
- ✅ Pagination for large result sets
- ✅ Efficient population of related documents
- ✅ Aggregation pipeline for statistics

## Monitoring

Monitor these key metrics:
- Order creation rate
- Order status distribution
- Average order value
- Cancellation rate
- API response times
- Error rates

## Production Considerations

Before deploying to production:

1. ✅ Set secure JWT_SECRET
2. ✅ Configure proper MongoDB URI
3. ✅ Set NODE_ENV=production
4. ✅ Configure CORS allowed origins
5. ✅ Set up proper logging
6. ✅ Configure error tracking (e.g., Sentry)
7. ✅ Set up monitoring and alerts
8. ✅ Configure database backups
9. ✅ Set up rate limiting at API Gateway level
10. ✅ Review and test all security measures

## Architecture

```
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────▼────────────────┐
    │  Order Service      │
    │  (Express API)      │
    └────┬───────┬────────┘
         │       │
    ┌────▼───┐ ┌▼────────────┐
    │Product │ │   Payment   │
    │Service │ │   Service   │
    └────────┘ └─────────────┘
         │              │
    ┌────▼──────────────▼───┐
    │      MongoDB          │
    └───────────────────────┘
```

## License

MIT

## Support

For issues or questions, contact the development team or create an issue in the repository.
