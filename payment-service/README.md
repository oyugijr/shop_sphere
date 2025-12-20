# Payment Service

Production-ready payment processing service for ShopSphere using Stripe.

## Features

- 💳 **Stripe Integration**: Full integration with Stripe Payment Intents API
- 🔒 **Secure**: JWT authentication, webhook signature verification
- 📊 **Complete Payment Lifecycle**: Create, confirm, cancel, and refund payments
- 🔔 **Webhook Support**: Real-time payment status updates via Stripe webhooks
- 📈 **Payment Analytics**: Track payment statistics and history
- 🧪 **Well-Tested**: Comprehensive test coverage
- 🐳 **Docker Ready**: Containerized for easy deployment

## API Endpoints

### Payment Intent Management

#### Create Payment Intent
```bash
POST /api/payments/intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439011",
  "amount": 9999,
  "currency": "usd",
  "metadata": {
    "productName": "Premium Laptop"
  }
}
```

#### Confirm Payment
```bash
POST /api/payments/:paymentIntentId/confirm
Authorization: Bearer <token>
```

#### Cancel Payment
```bash
POST /api/payments/:paymentIntentId/cancel
Authorization: Bearer <token>
```

### Payment Queries

#### Get Payment Status
```bash
GET /api/payments/status/:paymentIntentId
Authorization: Bearer <token>
```

#### Get Payment by Order ID
```bash
GET /api/payments/order/:orderId
Authorization: Bearer <token>
```

#### Get User Payment History
```bash
GET /api/payments/user?limit=50
Authorization: Bearer <token>
```

#### Get Payment Statistics
```bash
GET /api/payments/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

### Admin Operations

#### Refund Payment
```bash
POST /api/payments/:paymentIntentId/refund
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "amount": 5000  // Optional, defaults to full refund
}
```

### Webhooks

#### Stripe Webhook Endpoint
```bash
POST /api/payments/webhook
Stripe-Signature: <signature>
Content-Type: application/json

# Webhook events handled:
# - payment_intent.succeeded
# - payment_intent.payment_failed
# - payment_intent.canceled
# - payment_intent.processing
# - charge.refunded
```

## Environment Variables

```bash
# MongoDB
MONGO_URI=mongodb://mongodb:27017/shopSphere

# JWT
JWT_SECRET=your_jwt_secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Server Configuration
PORT=5005
NODE_ENV=production
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Add keys to your `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### 3. Configure Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
   - `charge.refunded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Start Service

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Docker:**
```bash
docker-compose up payment-service
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Payment Flow

### 1. Create Payment Intent
Client requests to create a payment intent with order details:
- Amount (in cents)
- Currency
- Order ID
- User ID (from JWT)

### 2. Client Completes Payment
Frontend uses Stripe.js to collect payment details and confirms payment with the `client_secret`.

### 3. Webhook Notification
Stripe sends webhook events to update payment status in real-time:
- `payment_intent.succeeded` → Status: succeeded
- `payment_intent.payment_failed` → Status: failed
- etc.

### 4. Order Fulfillment
Once payment succeeds, the order service is notified to fulfill the order.

## Security Features

- ✅ JWT authentication for all protected routes
- ✅ Role-based access control (admin-only refunds)
- ✅ Stripe webhook signature verification
- ✅ Input validation and sanitization
- ✅ Environment-based secrets management
- ✅ Secure MongoDB connections
- ✅ Rate limiting (configured at API Gateway)
- ✅ CORS configuration
- ✅ Error handling and logging

## Data Model

### Payment Schema
```javascript
{
  orderId: ObjectId,           // Reference to order
  userId: ObjectId,            // Reference to user
  stripePaymentIntentId: String, // Stripe payment intent ID
  amount: Number,              // Amount in dollars
  currency: String,            // Currency code (e.g., 'usd')
  status: String,              // pending, processing, succeeded, failed, canceled, refunded
  paymentMethod: String,       // Payment method used
  refundId: String,            // Stripe refund ID if refunded
  refundAmount: Number,        // Refund amount if partial refund
  metadata: Map,               // Additional metadata
  errorMessage: String,        // Error message if failed
  createdAt: Date,
  updatedAt: Date
}
```

## Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "payment-service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

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
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate payment)
- `500`: Internal Server Error

## Production Considerations

### Before Going Live

1. **Switch to Live Keys**: Replace test keys with live Stripe keys
2. **Enable Webhook Security**: Ensure `STRIPE_WEBHOOK_SECRET` is configured
3. **Use HTTPS**: All endpoints must use HTTPS in production
4. **Configure Rate Limiting**: Set appropriate rate limits at API Gateway
5. **Monitor Logs**: Set up proper logging and monitoring
6. **Database Backups**: Implement automated MongoDB backups
7. **Error Tracking**: Integrate error tracking (e.g., Sentry)
8. **Load Testing**: Test payment flow under expected load

### Monitoring

Monitor these metrics:
- Payment success rate
- Average payment processing time
- Failed payment reasons
- Refund rate
- Webhook delivery success rate

## Troubleshooting

### Webhook Issues
- Verify webhook signature is enabled
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Ensure endpoint is publicly accessible
- Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

### Payment Failures
- Check Stripe Dashboard for detailed error messages
- Verify API keys are correct
- Ensure amounts are in cents (not dollars)
- Check currency is supported

## Integration Example

```javascript
// Frontend: Create payment intent
const response = await fetch('/api/payments/intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    orderId: '507f1f77bcf86cd799439011',
    amount: 9999,  // $99.99 in cents
    currency: 'usd'
  })
});

const { data } = await response.json();
const { client_secret } = data;

// Use Stripe.js to complete payment
const stripe = Stripe('pk_test_...');
const { error, paymentIntent } = await stripe.confirmCardPayment(
  client_secret,
  {
    payment_method: {
      card: cardElement,
      billing_details: { name: 'Customer Name' }
    }
  }
);

if (error) {
  console.error('Payment failed:', error.message);
} else if (paymentIntent.status === 'succeeded') {
  console.log('Payment successful!');
}
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support@shopsphere.com.
