# Keverd Integration Testing Guide

This guide provides step-by-step instructions for testing the Keverd fraud detection integration in ShopSphere.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 16+ installed
- Git repository cloned
- Keverd account (sign up at https://app.keverd.com)

---

## Quick Start

### 1. Get Keverd API Key

1. Visit https://app.keverd.com
2. Sign up for a free account
3. Create a new project
4. Navigate to Project Settings
5. Copy your API key

### 2. Configure Environment

```bash
# Navigate to project root
cd shop_sphere

# Copy environment template
cp .env.example .env

# Edit .env and add your Keverd API key
# Find these lines and update:
KEVERD_API_KEY=your_keverd_api_key_here
KEVERD_ENABLED=true
KEVERD_BLOCK_THRESHOLD=75
KEVERD_CHALLENGE_THRESHOLD=50
```

### 3. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose ps

# Check logs
docker logs payment-service
```

Look for this message:
```
🛡️  Fraud Detection: Enabled (Keverd)
```

---

## Test Scenarios

### Scenario 1: Health Check ✅

**Purpose:** Verify fraud detection is enabled

```bash
curl http://localhost:5005/health | jq
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "payment-service",
  "fraudDetection": {
    "enabled": true,
    "provider": "keverd"
  }
}
```

**✅ Pass Criteria:** `fraudDetection.enabled` is `true`

---

### Scenario 2: User Registration & Login

**Purpose:** Get JWT token for authenticated requests

#### 2a. Register a Test User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Test User",
      "email": "testuser@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2b. Login (if already registered)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**✅ Pass Criteria:** Receive a JWT token

**Save the token for next steps:**
```bash
# Copy the token value
export JWT_TOKEN="paste_your_token_here"
```

---

### Scenario 3: Create Order

**Purpose:** Create an order to test payment flow

```bash
# First, create a product (requires admin token or direct DB insert)
# For testing, we'll use an existing product or create one via admin

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "productId": "your_product_id_here",
        "quantity": 1,
        "price": 50.00
      }
    ],
    "totalAmount": 50.00,
    "shippingAddress": {
      "street": "123 Test Street",
      "city": "Test City",
      "state": "TC",
      "zipCode": "12345",
      "country": "US"
    }
  }'
```

**✅ Pass Criteria:** Order created successfully

**Save the order ID:**
```bash
export ORDER_ID="paste_order_id_here"
```

---

### Scenario 4: Low Risk Payment (Should Pass) ✅

**Purpose:** Test successful payment with low fraud risk

```bash
curl -X POST http://localhost:5005/api/payments/intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "amount": 5000,
    "currency": "usd"
  }' | jq
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_xxxxx",
    "client_secret": "pi_xxxxx_secret_xxxxx",
    "status": "requires_payment_method",
    "payment": {
      "orderId": "...",
      "amount": 50.00,
      "status": "pending",
      "fraudDetection": {
        "enabled": true,
        "riskScore": 25,
        "action": "allow",
        "reasons": ["low_risk"],
        "sessionId": "...",
        "checkedAt": "..."
      }
    },
    "fraudCheck": {
      "fraudCheckEnabled": true,
      "riskScore": 25,
      "riskLevel": "low",
      "action": "allow",
      "reasons": ["low_risk"]
    }
  }
}
```

**✅ Pass Criteria:**
- Payment intent created successfully
- `fraudCheck.fraudCheckEnabled` is `true`
- `fraudCheck.riskScore` is present (0-100)
- `fraudCheck.action` is `"allow"`
- Response includes fraud detection data

---

### Scenario 5: Check Payment in Database

**Purpose:** Verify fraud data is stored in database

```bash
# Connect to MongoDB
docker exec -it mongodb mongosh shopSphere

# Query payment with fraud detection data
db.payments.find({
  "fraudDetection.enabled": true
}).pretty()
```

**Expected Output:**
```javascript
{
  _id: ObjectId("..."),
  orderId: "...",
  amount: 50.00,
  status: "pending",
  fraudDetection: {
    enabled: true,
    riskScore: 25,
    action: "allow",
    reasons: ["low_risk"],
    sessionId: "session-xxxxx",
    requestId: "request-xxxxx",
    checkedAt: ISODate("2026-01-08T...")
  },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**✅ Pass Criteria:** Fraud detection data is saved in database

---

### Scenario 6: Monitor Logs

**Purpose:** Verify fraud detection is logging correctly

```bash
# Watch payment service logs
docker logs -f payment-service

# Look for messages like:
# "Fraud check for order order-123: { riskScore: 25, action: 'allow', reasons: ['low_risk'] }"
```

**✅ Pass Criteria:** Fraud detection log messages appear

---

### Scenario 7: Test with Fraud Detection Disabled

**Purpose:** Verify graceful handling when fraud detection is disabled

```bash
# Update .env
KEVERD_ENABLED=false

# Restart payment service
docker-compose restart payment-service

# Create payment intent (same as Scenario 4)
curl -X POST http://localhost:5005/api/payments/intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "amount": 5000,
    "currency": "usd"
  }' | jq
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "fraudCheck": {
      "fraudCheckEnabled": false
    }
  }
}
```

**✅ Pass Criteria:**
- Payment still works
- `fraudCheckEnabled` is `false`
- No fraud data in response

---

## Advanced Testing

### Test Different Risk Levels

The Keverd SDK will return different risk scores based on transaction patterns. To test different scenarios:

#### Medium Risk Transaction (50-74)
- Try transactions with unusual patterns
- Different IP address
- First-time buyer
- High-value purchase

**Expected:** Transaction allowed but flagged in logs

#### High Risk Transaction (≥75)
- Multiple rapid transactions
- Suspicious device fingerprint
- Velocity threshold exceeded

**Expected:** Transaction blocked with error message

---

## Automated Testing

### Run Unit Tests

```bash
cd payment-service
npm install
npm test
```

**Expected:**
```
Test Suites: 5 passed, 5 total
Tests:       73 passed, 73 total
```

### Run Specific Test Suites

```bash
# Test only Keverd service
npm test -- keverdService.test.js

# Test payment service with fraud detection
npm test -- paymentServiceFraud.test.js
```

---

## Troubleshooting

### Issue: "Keverd API key not configured"

**Solution:**
```bash
# Check .env file
cat .env | grep KEVERD

# Make sure KEVERD_API_KEY is set
# Restart services
docker-compose restart payment-service
```

### Issue: "Cannot find module '@keverdjs/fraud-sdk'"

**Solution:**
```bash
# Reinstall dependencies
cd payment-service
rm -rf node_modules package-lock.json
npm install

# Rebuild Docker image
docker-compose build payment-service
docker-compose up -d payment-service
```

### Issue: Fraud detection not working

**Checklist:**
```bash
# 1. Check environment variables
docker exec payment-service env | grep KEVERD

# 2. Check service logs
docker logs payment-service | grep -i "fraud\|keverd"

# 3. Verify health endpoint
curl http://localhost:5005/health | jq '.fraudDetection'

# 4. Test API key is valid
# Visit https://app.keverd.com and verify project is active
```

### Issue: Tests failing

**Solution:**
```bash
# Clean install
cd payment-service
rm -rf node_modules package-lock.json
npm install

# Run tests
npm test

# If specific test fails, check error message
npm test -- --verbose
```

---

## Monitoring Fraud Metrics

### Query Fraud Statistics

```javascript
// Connect to MongoDB
docker exec -it mongodb mongosh shopSphere

// Count total payments checked
db.payments.countDocuments({ "fraudDetection.enabled": true })

// Count blocked transactions
db.payments.countDocuments({ "fraudDetection.action": "block" })

// Count flagged transactions (medium risk)
db.payments.countDocuments({ 
  "fraudDetection.riskScore": { $gte: 50, $lte: 74 } 
})

// Average risk score
db.payments.aggregate([
  { $match: { "fraudDetection.enabled": true } },
  { $group: { 
    _id: null, 
    avgRiskScore: { $avg: "$fraudDetection.riskScore" },
    minRiskScore: { $min: "$fraudDetection.riskScore" },
    maxRiskScore: { $max: "$fraudDetection.riskScore" }
  }}
])

// Most common fraud reasons
db.payments.aggregate([
  { $match: { "fraudDetection.enabled": true } },
  { $unwind: "$fraudDetection.reasons" },
  { $group: { 
    _id: "$fraudDetection.reasons", 
    count: { $sum: 1 } 
  }},
  { $sort: { count: -1 } }
])
```

---

## Performance Testing

### Measure Fraud Check Latency

```bash
# Install Apache Bench (if not installed)
# sudo apt-get install apache2-utils

# Run load test
ab -n 100 -c 10 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -p payment_payload.json \
  http://localhost:5005/api/payments/intent

# Create payment_payload.json:
cat > payment_payload.json << EOF
{
  "orderId": "order-perf-test",
  "amount": 5000,
  "currency": "usd"
}
EOF
```

**Expected:** 
- 95th percentile < 200ms
- No errors
- Fraud check adds ~50-150ms latency

---

## Feedback Collection

### What to Test

- [ ] SDK loads correctly
- [ ] Health endpoint shows fraud detection enabled
- [ ] Payment intents include fraud check data
- [ ] Risk scores are reasonable (not always 0)
- [ ] Different transactions get different risk scores
- [ ] High-risk transactions are blocked
- [ ] Medium-risk transactions are flagged
- [ ] Fraud data is saved to database
- [ ] Logs show fraud detection activity
- [ ] Service works even if Keverd API fails

### Report Template

```markdown
## Test Results

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Environment:** Development/Staging/Production

### Functionality
- [ ] Fraud detection enabled: YES / NO
- [ ] Risk scores present: YES / NO
- [ ] Risk scores realistic: YES / NO / NOTES: ___
- [ ] Blocking works: YES / NO / NOT TESTED
- [ ] Flagging works: YES / NO / NOT TESTED

### Performance
- [ ] Latency acceptable (<200ms): YES / NO
- [ ] No service disruptions: YES / NO
- [ ] Error handling works: YES / NO / NOT TESTED

### Issues
1. Issue description: ___
   - Steps to reproduce: ___
   - Expected: ___
   - Actual: ___

### Observations
- ___

### Recommendations
- ___
```

---

## Next Steps

1. ✅ Complete all test scenarios above
2. 📊 Monitor metrics for 1-2 weeks
3. 📈 Analyze fraud patterns
4. ⚙️ Tune thresholds if needed
5. 🚀 Deploy to production using phased rollout

---

## Support

- **Documentation:** See `KEVERD_INTEGRATION_REVIEW.md`
- **Keverd Support:** support@keverd.com
- **GitHub Issues:** https://github.com/oyugijr/shop_sphere/issues
- **Quick Start:** See `payment-service/FRAUD_DETECTION_QUICKSTART.md`

---

**Last Updated:** January 8, 2026
