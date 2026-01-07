# Keverd Fraud Detection Integration

This document describes the integration of Keverd fraud detection into the ShopSphere payment service.

## Overview

Keverd fraud detection has been integrated into the payment service to protect against fraudulent transactions. The system analyzes transaction patterns, device fingerprints, and behavioral biometrics to assess fraud risk in real-time.

## Features

- **Real-time fraud assessment** - Every payment intent is analyzed for fraud risk
- **Risk scoring** - Transactions receive a risk score from 0-100
- **Configurable thresholds** - Block or challenge transactions based on risk levels
- **Detailed risk reasons** - Understand why a transaction was flagged
- **Session tracking** - Track fraud detection sessions for audit purposes
- **Graceful degradation** - System continues to work even if fraud detection fails

## Configuration

Add the following environment variables to your `.env` file:

```bash
# Keverd Fraud Detection Configuration
KEVERD_API_KEY=your_keverd_api_key_here
KEVERD_ENDPOINT=https://app.keverd.com
KEVERD_ENABLED=true
KEVERD_BLOCK_THRESHOLD=75
KEVERD_CHALLENGE_THRESHOLD=50
```

### Configuration Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `KEVERD_API_KEY` | Your Keverd API key from dashboard | - | Yes |
| `KEVERD_ENDPOINT` | Keverd API endpoint | `https://app.keverd.com` | No |
| `KEVERD_ENABLED` | Enable/disable fraud detection | `true` | No |
| `KEVERD_BLOCK_THRESHOLD` | Risk score threshold for blocking (0-100) | `75` | No |
| `KEVERD_CHALLENGE_THRESHOLD` | Risk score threshold for challenge (0-100) | `50` | No |

### Getting Your API Key

1. Sign up at [Keverd Dashboard](https://app.keverd.com)
2. Create a new project
3. Copy your API key from the project settings
4. Add it to your `.env` file

## How It Works

### Payment Flow with Fraud Detection

1. **Customer initiates payment** - Request received at `/api/payments/intent`
2. **Fraud assessment** - Keverd analyzes the transaction:
   - Device fingerprinting
   - Behavioral analysis
   - Pattern recognition
   - Risk scoring
3. **Decision making**:
   - **Risk Score < 50** (Low risk) - Allow transaction
   - **Risk Score 50-74** (Medium risk) - Allow but flag for review
   - **Risk Score ≥ 75** (High risk) - Block transaction
4. **Response** - Client receives payment intent or fraud block message

### Risk Levels

| Risk Score | Level | Action |
|------------|-------|--------|
| 0-24 | Minimal | Allow |
| 25-49 | Low | Allow |
| 50-74 | Medium | Allow + Challenge/Review |
| 75-100 | High | Block |

## API Changes

### Create Payment Intent Response

The payment intent response now includes fraud detection information:

```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_xxxxx",
    "client_secret": "pi_xxxxx_secret_xxxxx",
    "status": "requires_payment_method",
    "payment": {
      "_id": "...",
      "orderId": "...",
      "amount": 100.00,
      "status": "pending",
      "fraudDetection": {
        "enabled": true,
        "riskScore": 25,
        "action": "allow",
        "reasons": ["low_risk"],
        "sessionId": "session-123",
        "requestId": "request-456",
        "checkedAt": "2026-01-07T15:30:00.000Z"
      }
    },
    "fraudCheck": {
      "fraudCheckEnabled": true,
      "riskScore": 25,
      "riskLevel": "low",
      "action": "allow",
      "reasons": ["low_risk"],
      "sessionId": "session-123"
    }
  }
}
```

### Blocked Transaction Response

When a transaction is blocked due to high fraud risk:

```json
{
  "error": "Failed to create payment intent",
  "message": "Transaction blocked due to high fraud risk. Risk score: 85"
}
```

### Health Check Response

The health check endpoint now includes fraud detection status:

```json
{
  "status": "healthy",
  "service": "payment-service",
  "timestamp": "2026-01-07T15:30:00.000Z",
  "uptime": 3600,
  "providers": ["stripe", "mpesa", "paypal"],
  "fraudDetection": {
    "enabled": true,
    "provider": "Keverd"
  }
}
```

## Database Schema

The `Payment` model has been extended with fraud detection fields:

```javascript
fraudDetection: {
  enabled: Boolean,        // Whether fraud check was performed
  riskScore: Number,       // Risk score 0-100
  action: String,          // 'allow', 'soft_challenge', 'hard_challenge', 'block'
  reasons: [String],       // Array of risk reasons
  sessionId: String,       // Keverd session ID
  requestId: String,       // Keverd request ID
  checkedAt: Date         // Timestamp of fraud check
}
```

## Monitoring and Analytics

### Viewing Fraud Detection Results

Query payments with fraud detection data:

```javascript
// Find high-risk transactions
Payment.find({
  'fraudDetection.riskScore': { $gte: 75 }
})

// Find blocked transactions
Payment.find({
  'fraudDetection.action': 'block',
  status: 'failed'
})

// Find transactions flagged for review
Payment.find({
  'fraudDetection.riskScore': { $gte: 50, $lte: 74 }
})
```

### Key Metrics to Monitor

1. **Block Rate** - Percentage of transactions blocked
2. **Challenge Rate** - Percentage of transactions flagged for review
3. **Average Risk Score** - Trend of overall fraud risk
4. **Common Fraud Reasons** - Most frequent fraud indicators
5. **False Positive Rate** - Valid transactions incorrectly blocked

## Testing

### Unit Tests

Run the Keverd service tests:

```bash
cd payment-service
npm test -- keverdService.test.js
```

### Manual Testing

#### Test with Fraud Detection Enabled

```bash
# Set environment variables
export KEVERD_API_KEY=your_api_key
export KEVERD_ENABLED=true
export KEVERD_BLOCK_THRESHOLD=75

# Create a payment intent
curl -X POST http://localhost:5005/api/payments/intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "order-123",
    "amount": 10000,
    "currency": "usd"
  }'
```

#### Test with Fraud Detection Disabled

```bash
export KEVERD_ENABLED=false

# Create a payment intent (should work without fraud check)
curl -X POST http://localhost:5005/api/payments/intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "order-123",
    "amount": 10000,
    "currency": "usd"
  }'
```

## Security Considerations

1. **API Key Security** - Keep your Keverd API key secure and never commit it to version control
2. **Graceful Degradation** - System allows transactions if fraud detection fails (configurable)
3. **Logging** - All fraud decisions are logged for audit purposes
4. **Privacy** - Fraud detection respects user privacy while analyzing patterns

## Troubleshooting

### Common Issues

#### 1. "Keverd API key not configured"

**Solution**: Add `KEVERD_API_KEY` to your `.env` file

```bash
KEVERD_API_KEY=your_actual_api_key
```

#### 2. Transactions Always Blocked

**Solution**: Check your block threshold setting

```bash
# Lower the threshold or disable blocking temporarily
KEVERD_BLOCK_THRESHOLD=90
```

#### 3. Fraud Detection Not Working

**Solution**: Check if it's enabled

```bash
KEVERD_ENABLED=true
```

#### 4. API Connection Errors

**Solution**: Verify endpoint and network connectivity

```bash
# Test connection
curl https://app.keverd.com

# Check logs
docker logs payment-service
```

## Performance Impact

- **Latency**: ~100-200ms added per payment intent creation
- **Failure handling**: Transactions proceed if fraud check times out
- **Resource usage**: Minimal CPU and memory impact
- **Caching**: Session data cached by Keverd SDK

## Future Enhancements

- [ ] Admin dashboard for fraud analytics
- [ ] Custom fraud rules based on business logic
- [ ] Machine learning model training on historical data
- [ ] Integration with other fraud signals (IP reputation, email validation)
- [ ] Real-time fraud alerts via notifications
- [ ] A/B testing of fraud thresholds

## Support

- **Keverd Documentation**: [https://docs.keverd.com](https://docs.keverd.com)
- **Keverd Support**: <support@keverd.com>
- **ShopSphere Issues**: [GitHub Issues](https://github.com/oyugijr/shop_sphere/issues)

## References

- [Keverd SDK Documentation](https://github.com/keverd/keverd-fraud-sdk-web)
- [Payment Service Implementation](./PAYMENT_SERVICE_IMPLEMENTATION.md)
- [ShopSphere Architecture](../docs/ARCHITECTURE.md)
