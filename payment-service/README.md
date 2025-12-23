# Payment Service

Production-ready payment processing service for ShopSphere supporting **Stripe**, **M-Pesa**, and **PayPal**.

## Features

- **Stripe Integration**: Full integration with Stripe Payment Intents API
- **M-Pesa Integration**: Complete Safaricom M-Pesa Daraja API integration (STK Push & B2C)
- **PayPal Integration**: Complete PayPal Orders API v2 integration
- **Secure**: JWT authentication, webhook signature verification
- **Complete Payment Lifecycle**: Create, confirm, cancel, and refund payments
- **Webhook Support**: Real-time payment status updates via webhooks
- **Payment Analytics**: Track payment statistics and history
- **Well-Tested**: Comprehensive test coverage (49 tests passing)
- **Docker Ready**: Containerized for easy deployment

## Supported Payment Methods

### 1. Stripe (International Payments)

- Credit/Debit cards
- Digital wallets (Apple Pay, Google Pay)
- All Stripe-supported payment methods

### 2. M-Pesa (Kenya Mobile Money)

- STK Push (Lipa Na M-Pesa Online)
- B2C payments for refunds
- Real-time callback notifications

### 3. PayPal (Global Digital Payments)

- PayPal account payments
- Credit/Debit cards via PayPal
- Multi-currency support
- Buyer and seller protection

## API Endpoints

### Payment Intent Management

### Create Payment Intent

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
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000  // Optional, defaults to full refund
}
```

### Stripe Webhooks

#### Webhook Endpoint

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

## M-Pesa API Endpoints

### M-Pesa Payment Management

#### Initiate M-Pesa Payment (STK Push)

```bash
POST /api/mpesa/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439011",
  "amount": 1000,  // Amount in KES
  "phoneNumber": "254712345678",  // Kenyan phone number
  "metadata": {
    "productName": "Premium Service"
  }
}

Response:
{
  "success": true,
  "message": "STK Push sent successfully. Please check your phone to complete payment.",
  "data": {
    "checkoutRequestId": "ws_CO_DMZ_12345_12345678",
    "merchantRequestId": "1234-5678-9",
    "responseCode": "0",
    "responseDescription": "Success. Request accepted for processing",
    "customerMessage": "Success. Request accepted for processing"
  }
}
```

#### Query M-Pesa Payment Status

```bash
GET /api/mpesa/query/:checkoutRequestId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "_id": "payment_id",
    "orderId": "507f1f77bcf86cd799439011",
    "provider": "mpesa",
    "mpesaCheckoutRequestId": "ws_CO_DMZ_12345_12345678",
    "mpesaReceiptNumber": "NLJ7RT61SV",
    "amount": 1000,
    "currency": "kes",
    "status": "succeeded",
    "phoneNumber": "254712345678"
  }
}
```

#### Get M-Pesa Payment by Order ID

```bash
GET /api/mpesa/order/:orderId
Authorization: Bearer <token>
```

#### Refund M-Pesa Payment (Admin Only)

```bash
POST /api/mpesa/:checkoutRequestId/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500  // Optional, defaults to full refund
}
```

### M-Pesa Callback

#### Callback Endpoint (Public)

```bash
POST /api/mpesa/callback
Content-Type: application/json

# This endpoint receives callbacks from Safaricom
# No authentication required - called by M-Pesa servers
# Updates payment status automatically based on transaction result
```

## Phone Number Formats

M-Pesa accepts Kenyan phone numbers in multiple formats:

- `254712345678` (international format)
- `0712345678` (local format with leading zero)
- `712345678` (without country code or zero)

All formats are automatically converted to `254XXXXXXXXX` format.

## PayPal API Endpoints

### PayPal Payment Management

#### Create PayPal Order

```bash
POST /api/paypal/create
Authorization: ******
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439011",
  "amount": 99.99,  // Amount in base currency
  "currency": "USD",  // USD, EUR, GBP, etc.
  "metadata": {
    "description": "Premium Product"
  }
}

Response:
{
  "success": true,
  "message": "PayPal order created successfully. Redirect customer to approval URL.",
  "data": {
    "paypalOrderId": "8XC74156MK4567890",
    "status": "CREATED",
    "approvalUrl": "https://www.paypal.com/checkoutnow?token=8XC74156MK4567890",
    "payment": { ... }
  }
}
```

#### Capture PayPal Payment

After customer approves payment on PayPal, capture the payment:

```bash
POST /api/paypal/:paypalOrderId/capture
Authorization: ******

Response:
{
  "success": true,
  "message": "Payment captured successfully",
  "data": {
    "_id": "payment_id",
    "provider": "paypal",
    "paypalOrderId": "8XC74156MK4567890",
    "paypalCaptureId": "5TY1234567890ABCD",
    "paypalPayerEmail": "customer@example.com",
    "status": "succeeded",
    "amount": 99.99,
    "currency": "usd"
  }
}
```

#### Get PayPal Payment Status

```bash
GET /api/paypal/status/:paypalOrderId
Authorization: ******

Response:
{
  "success": true,
  "data": {
    "_id": "payment_id",
    "provider": "paypal",
    "paypalOrderId": "8XC74156MK4567890",
    "status": "succeeded",
    "amount": 99.99
  }
}
```

#### Get PayPal Payment by Order ID

```bash
GET /api/paypal/order/:orderId
Authorization: ******
```

#### Cancel PayPal Order

```bash
POST /api/paypal/:paypalOrderId/cancel
Authorization: ******
```

#### Refund PayPal Payment (Admin Only)

```bash
POST /api/paypal/:paypalOrderId/refund
Authorization: ******
Content-Type: application/json

{
  "amount": 50.00  // Optional, defaults to full refund
}

Response:
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "status": "refunded",
    "refundId": "REFUND-123",
    "refundAmount": 50.00
  }
}
```

## PayPal Payment Flow

1. **Create Order**: Customer selects PayPal payment method
2. **Redirect to PayPal**: Customer is redirected to approval URL
3. **Customer Approves**: Customer logs into PayPal and approves payment
4. **Capture Payment**: After approval, capture the payment
5. **Order Fulfillment**: Once captured, fulfill the order

**Frontend Integration Example:**

```javascript
// 1. Create PayPal order
const response = await fetch('/api/paypal/create', {
  method: 'POST',
  headers: {
    'Authorization': `******
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: '507f1f77bcf86cd799439011',
    amount: 99.99,
    currency: 'USD'
  })
});

const { data } = await response.json();

// 2. Redirect customer to PayPal
window.location.href = data.approvalUrl;

// 3. After customer approves and returns, capture payment
// (typically handled by return URL callback)
const captureResponse = await fetch(`/api/paypal/${data.paypalOrderId}/capture`, {
  method: 'POST',
  headers: {
    'Authorization': `******
  }
});

const { data: payment } = await captureResponse.json();
if (payment.status === 'succeeded') {
  // Payment successful, show confirmation
}
```

```sh
GET /api/payments/status/:paymentIntentId
Authorization: Bearer <token>
```

#### Get Payment by Order ID

```bash
GET /api/payments/order/:orderId
Authorization: Bearer <token>
```

### Get User Payment History

```bash
GET /api/payments/user?limit=50
Authorization: Bearer <token>
```

### Get Payment Statistics

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

# M-Pesa Configuration
MPESA_ENVIRONMENT=sandbox  # or production
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379  # Your business shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
MPESA_INITIATOR_NAME=testapi  # For B2C refunds
MPESA_SECURITY_CREDENTIAL=your_security_credential  # For B2C refunds

# PayPal Configuration
PAYPAL_ENVIRONMENT=sandbox  # or production
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_RETURN_URL=https://your-domain.com/payment/success
PAYPAL_CANCEL_URL=https://your-domain.com/payment/cancel

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

### 3. Configure M-Pesa

1. **Create Daraja Account**
   - Go to [Safaricom Daraja Portal](https://developer.safaricom.co.ke)
   - Create an account and log in
   - Create a new app

2. **Get Credentials**
   - Consumer Key and Consumer Secret from your app
   - Business Shortcode (Lipa Na M-Pesa Online)
   - Passkey (from Daraja sandbox or production credentials)

3. **Register Callback URLs**

   ```bash
   # Your callback URL must be publicly accessible
   MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
   ```

4. **Test with Sandbox**

   ```bash
   MPESA_ENVIRONMENT=sandbox
   MPESA_CONSUMER_KEY=<sandbox_consumer_key>
   MPESA_CONSUMER_SECRET=<sandbox_consumer_secret>
   MPESA_SHORTCODE=174379  # Sandbox shortcode
   MPESA_PASSKEY=<sandbox_passkey>
   ```

5. **Sandbox Test Credentials**
   - Test Phone Number: `254708374149`
   - Test Amount: Any amount between 1-70,000 KES
   - PIN: `0000` (for sandbox only)

### 4. Configure Webhooks

**Stripe:**

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
   - `charge.refunded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**M-Pesa:**

- Callbacks are automatically handled at `/api/mpesa/callback`
- Ensure this URL is publicly accessible and registered in Daraja portal
- M-Pesa will send callbacks for payment status updates

### 5. Configure PayPal

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer Portal](https://developer.paypal.com)
   - Create an account and log in
   - Navigate to Apps & Credentials

2. **Create App**
   - Create a new app for your business
   - Get your Client ID and Secret from the app details

3. **Set Environment**

   ```bash
   # For testing
   PAYPAL_ENVIRONMENT=sandbox
   PAYPAL_CLIENT_ID=<sandbox_client_id>
   PAYPAL_CLIENT_SECRET=<sandbox_client_secret>
   
   # For production
   PAYPAL_ENVIRONMENT=production
   PAYPAL_CLIENT_ID=<live_client_id>
   PAYPAL_CLIENT_SECRET=<live_client_secret>
   ```

4. **Configure Return URLs**

   ```bash
   PAYPAL_RETURN_URL=https://your-domain.com/payment/success
   PAYPAL_CANCEL_URL=https://your-domain.com/payment/cancel
   ```

5. **Sandbox Testing**
   - Use PayPal sandbox accounts for testing
   - Create test buyer and seller accounts in sandbox
   - Test transactions with sandbox credentials

### 6. Start Service

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

### **Stripe Payment Flow**

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

### **M-Pesa Payment Flow (STK Push)**

### 1. Initiate STK Push

Client requests M-Pesa payment:

- Amount (in KES)
- Phone number
- Order ID

### 2. STK Push Sent

- Service sends STK Push to customer's phone
- Customer receives prompt on their phone
- Customer enters M-Pesa PIN to authorize payment

### 3. Callback Received

M-Pesa sends callback to service:   

- `ResultCode: 0` → Payment succeeded
- `ResultCode: 1032` → Payment canceled by user
- Other codes → Payment failed

### 4. Status Update

Payment status is automatically updated based on callback:

- Success: Order can be fulfilled
- Failed/Canceled: Customer can retry payment

### 5. Order Fulfillment

Once payment succeeds, the order service is notified to fulfill the order.

## Multi-Provider Support

The payment service supports both Stripe and M-Pesa simultaneously:

- **Stripe**: For international payments (credit cards, digital wallets)
- **M-Pesa**: For Kenya mobile money payments

Choose provider based on:

- Customer location (Kenya = M-Pesa option, International = Stripe)
- Payment method preference
- Currency (KES = M-Pesa, USD/EUR/etc = Stripe)

## Payment Service Architecture

```sh
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
    ┌────▼────────────────┐
    │  Payment Service    │
    │  (Express API)      │
    └────┬────────────────┘
         │
    ┌────▼──────┬─────────┐
    │           │         │
┌───▼──────┐ ┌──▼─────┐  │
│  Stripe  │ │ M-Pesa │  │
│   API    │ │  API   │  │
└──────────┘ └────────┘  │
                      ┌──▼──────┐
                      │ MongoDB │
                      └─────────┘
```

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
  orderId: ObjectId,                    // Reference to order
  userId: ObjectId,                     // Reference to user
  provider: String,                     // 'stripe' or 'mpesa'
  
  // Stripe fields
  stripePaymentIntentId: String,        // Stripe payment intent ID
  
  // M-Pesa fields
  mpesaCheckoutRequestId: String,       // M-Pesa checkout request ID
  mpesaTransactionId: String,           // M-Pesa transaction ID
  mpesaReceiptNumber: String,           // M-Pesa receipt number
  phoneNumber: String,                  // Customer phone number (M-Pesa)
  
  amount: Number,                       // Amount in base currency
  currency: String,                     // Currency code (e.g., 'usd', 'kes')
  status: String,                       // pending, processing, succeeded, failed, canceled, refunded
  paymentMethod: String,                // Payment method used
  refundId: String,                     // Refund ID if refunded
  refundAmount: Number,                 // Refund amount if partial refund
  metadata: Map,                        // Additional metadata
  errorMessage: String,                 // Error message if failed
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ orderId: 1, status: 1 }` - Query payments by order and status
- `{ userId: 1, createdAt: -1 }` - User payment history
- `{ provider: 1, status: 1 }` - Provider-specific queries
- `{ stripePaymentIntentId: 1 }` - Stripe payment lookups (sparse)
- `{ mpesaCheckoutRequestId: 1 }` - M-Pesa payment lookups (sparse)

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

For issues or questions, please open an issue on GitHub or contact <support@shopsphere.com>.
