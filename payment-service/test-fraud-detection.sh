#!/bin/bash

# Manual Test Script for Fraud Detection

echo "=== Testing Payment Service with Fraud Detection ==="
echo ""

# Test 1: Health check
echo "Test 1: Checking service health..."
curl -s http://localhost:5005/health | jq '.fraudDetection' || echo "Service not running or jq not available"
echo ""

# Test 2: Create payment intent (requires JWT token)
echo "Test 2: Creating payment intent would require:"
echo "  - Running the payment service"
echo "  - Having a valid JWT token"
echo "  - Example command:"
echo '  curl -X POST http://localhost:5005/api/payments/intent \'
echo '    -H "Content-Type: application/json" \'
echo '    -H "Authorization: Bearer YOUR_JWT_TOKEN" \'
echo '    -d '"'"'{"orderId":"order-123","amount":10000,"currency":"usd"}'"'"
echo ""

echo "=== Manual Test Instructions ==="
echo ""
echo "To fully test the fraud detection integration:"
echo ""
echo "1. Set environment variables:"
echo "   export KEVERD_API_KEY=your_api_key"
echo "   export KEVERD_ENABLED=true"
echo "   export KEVERD_BLOCK_THRESHOLD=75"
echo "   export KEVERD_CHALLENGE_THRESHOLD=50"
echo ""
echo "2. Start the payment service:"
echo "   cd payment-service"
echo "   npm start"
echo ""
echo "3. Check the health endpoint:"
echo "   curl http://localhost:5005/health"
echo "   # Should show fraudDetection.enabled: true"
echo ""
echo "4. Create a test payment (requires authentication):"
echo "   # First get a JWT token by logging in via user-service"
echo "   # Then use the token to create a payment intent"
echo ""
echo "5. Monitor the logs for fraud detection messages:"
echo "   - Low risk: Transaction proceeds normally"
echo "   - Medium risk: 'Transaction flagged for review' message"
echo "   - High risk: Transaction blocked with error message"
echo ""
