# Order Service

The Order Service manages order creation, processing, and tracking for ShopSphere.

## Overview

The Order Service provides:
- **Order Creation**: Process new customer orders
- **Order Management**: Track and update order status
- **Order History**: View past orders
- **Status Tracking**: Monitor order lifecycle
- **Admin Operations**: Manage orders as admin

## Port

- **Default**: 5003
- **Configure via**: `ORDER_SERVICE_PORT` environment variable

## API Endpoints

### Create Order (Auth Required)
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id_here",
      "quantity": 2,
      "price": 999.99
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "phone": "555-1234"
  }
}
```

### Get Order (Auth Required)
```http
GET /api/orders/:id
Authorization: Bearer {token}
```

### Get User Orders (Auth Required)
```http
GET /api/orders?status=pending&page=1&limit=20
Authorization: Bearer {token}
```

### Update Order Status (Admin Only)
```http
PUT /api/orders/:id/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "shipped",
  "note": "Order shipped via FedEx"
}
```

## Database Schema

### Order Model

```javascript
{
  orderNumber: String,        // Auto-generated, unique (e.g., ORD-2401-1234)
  userId: ObjectId,           // Reference to User
  items: [{
    productId: ObjectId,      // Reference to Product
    name: String,             // Product name at time of order
    price: Number,            // Price at time of order
    quantity: Number,
    subtotal: Number
  }],
  totals: {
    subtotal: Number,
    tax: Number,
    shipping: Number,
    discount: Number,
    total: Number
  },
  status: String,             // pending, processing, shipped, delivered, cancelled
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  payment: {
    method: String,
    status: String,
    transactionId: String,
    paidAt: Date
  },
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Status Values
- `pending` - Order created, awaiting payment
- `processing` - Payment received, preparing order
- `shipped` - Order shipped to customer
- `delivered` - Order delivered successfully
- `cancelled` - Order cancelled

### Indexes
- Compound index on `userId` and `createdAt`
- Unique index on `orderNumber`
- Index on `status` and `createdAt`

## Configuration

```env
PORT=5003
MONGO_URI=mongodb://mongodb:27017/shopSphere
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
order-service/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── orderController.js
│   ├── models/
│   │   └── Order.js
│   ├── routes/
│   │   └── orderRoutes.js
│   ├── services/
│   │   └── orderService.js
│   ├── repositories/
│   │   └── orderRepository.js
│   └── middlewares/
│       ├── authMiddleware.js
│       └── roleMiddleware.js
├── tests/
├── app.js
├── Dockerfile
└── package.json
```

## Features

### Automatic Calculations
- Order subtotal
- Tax calculation (10%)
- Shipping (free over $100)
- Total amount

### Order Tracking
- Status history
- Timestamp for each status change
- Optional notes for status updates

### Order Number Generation
Format: `ORD-YYMM-XXXX`
- YY: Year (2 digits)
- MM: Month (2 digits)
- XXXX: Random 4-digit number

## Business Logic

### Order Creation Flow
1. Validate user authentication
2. Validate product availability
3. Calculate totals
4. Generate order number
5. Create order in database
6. (Future) Update product inventory
7. (Future) Send confirmation email

### Order Status Updates
Only admins can update order status. Each status change is logged in statusHistory.

## Running Locally

```bash
# With Docker
docker-compose up order-service

# Standalone
cd order-service
npm install
npm start
```

## Testing

```bash
npm test
npm run test:coverage
```

## Troubleshooting

### Order Creation Fails
- Verify user is authenticated
- Check product IDs are valid
- Ensure shipping address is complete

### Cannot Update Status
- Verify user has admin role
- Check order exists
- Validate status value is allowed

## Future Enhancements

- [ ] Payment gateway integration
- [ ] Inventory reservation during checkout
- [ ] Order cancellation by users
- [ ] Refund processing
- [ ] Order tracking integration

## Contributing

See [Contributing Guide](../CONTRIBUTING.md)

## Related Documentation

- [API Documentation](../docs/API.md)
- [Database Guide](../docs/DATABASE.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)

---

**Maintained by**: ShopSphere Team
