# Keverd Fraud Detection Quickstart Guide

This guide provides a quick overview of the Keverd fraud detection integration in ShopSphere.

## Overview

Keverd fraud detection has been successfully integrated into the ShopSphere payment service to protect against fraudulent transactions. The system analyzes transaction patterns, device fingerprints, and behavioral biometrics in real-time.

## What Was Added

### 1. **Keverd SDK Integration**

- Added `@keverdjs/fraud-sdk` package
- Initialized Keverd on payment service startup

### 2. **Fraud Detection Service** (`src/services/keverdService.js`)

- Real-time fraud risk assessment
- Configurable risk thresholds
- Graceful degradation if fraud check fails
- Session tracking for audit purposes

### 3. **Enhanced Payment Model**

- Added `fraudDetection` field to Payment schema
- Stores risk score, action, reasons, session IDs

### 4. **Payment Flow Integration**

- Fraud check runs automatically on every payment intent creation
- Transactions blocked if risk score exceeds threshold
- Medium-risk transactions logged for review

### 5. **Comprehensive Testing**

- 24 new tests added (19 + 5)
- All 73 tests passing
- Unit tests for fraud service
- Integration tests for payment flow

### 6. **Documentation**

- Complete fraud detection guide (`FRAUD_DETECTION.md`)
- API documentation updates
- Configuration examples
- Troubleshooting guide

## Quick Setup

### 1. Configure Environment Variables

Add to your `.env` file:

```bash
KEVERD_API_KEY=your_api_key_here
KEVERD_ENABLED=true
KEVERD_BLOCK_THRESHOLD=75
KEVERD_CHALLENGE_THRESHOLD=50
```

### 2. Get Your API Key

1. Sign up at [Keverd Dashboard](https://app.keverd.com)
2. Create a project
3. Copy your API key
4. Add it to `.env`

### 3. Start the Service

```bash
cd payment-service
npm install
npm start
```

### 4. Verify It's Working

```bash
# Check health endpoint
curl http://localhost:5005/health | jq '.fraudDetection'

# Should show:
# {
#   "enabled": true,
#   "provider": "Keverd"
# }
```

## How It Works

### Payment Flow

```sh
1. Client → POST /api/payments/intent
            ↓
2. Fraud Detection Check (Keverd)
   - Device fingerprinting
   - Behavioral analysis
   - Risk scoring
            ↓
3. Risk Decision:
   - Score < 50: Allow (Low risk)
   - Score 50-74: Allow + Flag (Medium risk)
   - Score ≥ 75: Block (High risk)
            ↓
4. Response to Client
   - Success: Payment intent + fraud data
   - Blocked: Error message with risk score
```

### Risk Levels

| Score | Level | Action |
| --- | --- | --- |
| 0-24 | Minimal | ✅ Allow |
| 25-49 | Low | ✅ Allow |
| 50-74 | Medium | ⚠️  Allow + Review |
| 75-100 | High | ❌ Block |

## API Response Examples

### Low Risk Transaction (Allowed)

```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_xxxxx",
    "client_secret": "pi_xxxxx_secret",
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

### High Risk Transaction (Blocked)

```json
{
  "error": "Failed to create payment intent",
  "message": "Transaction blocked due to high fraud risk. Risk score: 85"
}
```

## Testing

### Run Tests

```bash
cd payment-service
npm test
```

### Test Coverage

- **Keverd Service**: 19 tests
- **Payment Service with Fraud**: 5 tests
- **Existing Payment Tests**: Updated and passing
- **Total**: 73 tests, all passing ✅

## Key Features

✅ **Real-time fraud detection** on all payments  
✅ **Configurable thresholds** for blocking/flagging  
✅ **Graceful degradation** if fraud service fails  
✅ **Detailed risk reasons** for every transaction  
✅ **Session tracking** for audit trails  
✅ **Zero breaking changes** to existing API  
✅ **Comprehensive test coverage**  
✅ **Production-ready** with error handling  

## Configuration Options

| Variable | Description | Default |
| --- | --- | --- |
| `KEVERD_API_KEY` | Your Keverd API key | Required |
| `KEVERD_ENABLED` | Enable/disable fraud detection | `true` |
| `KEVERD_ENDPOINT` | Keverd API endpoint | `https://app.keverd.com` |
| `KEVERD_BLOCK_THRESHOLD` | Score to block transactions | `75` |
| `KEVERD_CHALLENGE_THRESHOLD` | Score to flag for review | `50` |

## Monitoring

### View Fraud Detection in Logs

```bash
# Watch payment service logs
docker logs -f payment-service

# You'll see:
# "Fraud check for order order-123: { riskScore: 25, action: 'allow', reasons: ['low_risk'] }"
# "Transaction flagged for review. Order: order-456, Risk Score: 60"
# "Transaction blocked due to high fraud risk. Order: order-789, Risk Score: 85"
```

### Query Fraud Data

```javascript
// Find high-risk transactions
await Payment.find({ 'fraudDetection.riskScore': { $gte: 75 } })

// Find blocked transactions
await Payment.find({ 
  'fraudDetection.action': 'block',
  status: 'failed'
})
```

## Documentation

- **Full Guide**: [`FRAUD_DETECTION.md`](./FRAUD_DETECTION.md)
- **Manual Testing**: [`test-fraud-detection.sh`](./test-fraud-detection.sh)
- **Keverd SDK Docs**: <https://github.com/keverd/keverd-fraud-sdk-web>

## Support

- **Issues**: [GitHub Issues](https://github.com/oyugijr/shop_sphere/issues)
- **Keverd Support**: <support@keverd.com>
- **Keverd Dashboard**: <https://app.keverd.com>

## Summary

The Keverd fraud detection integration is now live and ready for use! It provides:

- ✅ Real-time fraud protection
- ✅ Configurable risk management
- ✅ Comprehensive audit trails
- ✅ Zero breaking changes
- ✅ Production-ready implementation

Get your Keverd API key and enable fraud detection today! 🛡️
