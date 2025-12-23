# Order Service - Manual Testing Guide

This guide provides examples for manually testing the order service endpoints.

## Prerequisites

1. MongoDB running on `localhost:27017` or configured via `MONGO_URI`
2. Order service running on port `5003`
3. Product service running on port `5002` (for stock validation)
4. Payment service running on port `5005` (for payment tracking)

## Environment Setup

```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongo mongo:latest

# Set environment variables
export MONGO_URI="mongodb://localhost:27017/shopSphere"
export JWT_SECRET="your_jwt_secret"
export NODE_ENV="development"
export PRODUCT_SERVICE_URL="http://localhost:5002"
export PAYMENT_SERVICE_URL="http://localhost:5005"

# Start order service
cd order-service
npm start
```

## Generate Test Tokens

```javascript
// Run this in Node.js REPL or save as generate-tokens.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = 'your_jwt_secret';
const userId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();

const userToken = jwt.sign({ id: userId.toString(), role: 'user' }, JWT_SECRET);
const adminToken = jwt.sign({ id: adminId.toString(), role: 'admin' }, JWT_SECRET);

console.log('User Token:', userToken);
console.log('Admin Token:', adminToken);
console.log('User ID:', userId.toString());
```

## API Testing Examples

### 1. Health Check

```bash
curl http://localhost:5003/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "order-service",
  "timestamp": "2024-12-23T10:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Create Order (with product validation)

**Note:** This requires the product service to be running.

```bash
curl -X POST http://localhost:5003/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "items": [
      {
        "productId": "VALID_PRODUCT_ID",
        "product": "VALID_PRODUCT_ID",
        "quantity": 2,
        "price": 99.99,
        "name": "Test Product"
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
  }'
```

**Expected Success Response (201):**
```json
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
    "createdAt": "2024-12-23T10:00:00.000Z",
    "updatedAt": "2024-12-23T10:00:00.000Z"
  }
}
```

**Expected Error Response (400) - Product service unavailable:**
```json
{
  "error": "Error",
  "message": "Product service unavailable"
}
```

### 3. Test Without Authentication

```bash
curl -X POST http://localhost:5003/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [],
    "totalPrice": 0,
    "shippingAddress": {}
  }'
```

**Expected Response (401):**
```json
{
  "error": "Access denied. No token provided."
}
```

### 4. Get My Orders

```bash
curl -X GET "http://localhost:5003/api/orders/my-orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Expected Response (200):**
```json
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

### 5. Get Order by ID

```bash
curl -X GET http://localhost:5003/api/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1703000000000-123",
    ...
  }
}
```

**Expected Error Response (404):**
```json
{
  "error": "Error",
  "message": "Order not found"
}
```

### 6. Get Order Statistics

```bash
curl -X GET http://localhost:5003/api/orders/stats \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Expected Response (200):**
```json
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

### 7. Cancel Order

```bash
curl -X POST http://localhost:5003/api/orders/ORDER_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "reason": "Changed my mind about the purchase"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "_id": "order_id",
    "status": "cancelled",
    "cancelReason": "Changed my mind about the purchase",
    "cancelledAt": "2024-12-23T10:30:00.000Z"
  }
}
```

### 8. Update Order Status (Admin Only)

```bash
curl -X PUT http://localhost:5003/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "shipped",
    "note": "Order shipped via FedEx, Tracking: 1234567890"
  }'
```

**Expected Response (200):**
```json
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

**Expected Error Response (403) - Non-admin user:**
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 9. Get All Orders (Admin Only)

```bash
curl -X GET "http://localhost:5003/api/orders?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [...orders],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### 10. Update Payment Status (Admin Only)

```bash
curl -X PUT http://localhost:5003/api/orders/ORDER_ID/payment-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "paymentStatus": "completed",
    "paymentId": "pi_1234567890",
    "paymentMethod": "stripe"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "_id": "order_id",
    "paymentStatus": "completed",
    "paymentId": "pi_1234567890",
    "paymentMethod": "stripe"
  }
}
```

## Testing with Postman/Insomnia

1. Import the endpoints from above
2. Set up environment variables for:
   - `baseUrl`: `http://localhost:5003`
   - `userToken`: Your generated user token
   - `adminToken`: Your generated admin token
3. Create a collection with all the endpoints
4. Test each endpoint sequentially

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Order must contain at least one item"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "error": "Error",
  "message": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error",
  "message": "Database connection failed"
}
```

## Troubleshooting

### Product service unavailable
- Ensure product service is running on configured port
- Check `PRODUCT_SERVICE_URL` environment variable
- Verify network connectivity between services

### Database connection errors
- Verify MongoDB is running
- Check `MONGO_URI` environment variable
- Ensure MongoDB is accessible from the service

### Authentication errors
- Verify JWT_SECRET matches between services
- Check token expiration
- Ensure Authorization header format: `Bearer TOKEN`

## Next Steps

1. Start all required services (Product, Payment, Order)
2. Generate test tokens
3. Create test products in product service
4. Test complete order flow from creation to delivery
5. Test error scenarios (invalid data, insufficient stock, etc.)
6. Monitor logs for any issues
7. Verify order history and status transitions
