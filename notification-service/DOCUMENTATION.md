# Notification Service Documentation

## Overview

The ShopSphere Notification Service is a production-ready microservice that handles email, SMS, and WhatsApp notifications using a queue-based architecture. It provides reliable delivery with retry mechanisms, comprehensive error handling, and detailed monitoring capabilities.

## Architecture

### Components

1. **HTTP API Server** (Express)
   - REST endpoints for sending notifications
   - Health check and readiness probes
   - Template-based notification endpoints

2. **Bull Queue** (Job Processing)
   - Reliable job processing with retries
   - Exponential backoff strategy
   - Dead letter queue for failed jobs

3. **Redis Pub/Sub** (Event-Driven)
   - Asynchronous event publishing
   - Worker subscription for job creation

4. **MongoDB** (Persistence)
   - Notification history storage
   - User notification tracking
   - Delivery status management

5. **Brevo API Integration**
   - Email delivery via Brevo SMTP
   - SMS delivery via Brevo transactional SMS
   - WhatsApp delivery via Brevo WhatsApp API

### Data Flow

```
Service Request → Create Notification (MongoDB) → Publish to Redis
                                                         ↓
                Worker Subscribes → Add to Bull Queue → Process Job
                                                         ↓
                                    Send via Brevo API → Update Status (MongoDB)
```

## Configuration

### Environment Variables

Required environment variables in `.env`:

```env
# MongoDB
MONGO_URI=mongodb://mongodb:27017/shopSphere

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# Brevo API
BREVO_API_URL=https://api.brevo.com/v3
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=noreply@shopsphere.com
EMAIL_FROM_NAME=ShopSphere

# Service
PORT=5004
NODE_ENV=production
```

### Docker Configuration

The service runs in a Docker container with the following specifications:

- **Base Image:** node:18
- **Port:** 5004
- **Dependencies:** MongoDB, Redis
- **Restart Policy:** unless-stopped

## API Endpoints

### Health & Monitoring

#### GET /health
Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "notification-service",
  "timestamp": "2024-01-04T20:00:00.000Z"
}
```

#### GET /health/detailed
Detailed health check with queue metrics.

**Response:**
```json
{
  "service": "notification-service",
  "status": "healthy",
  "timestamp": "2024-01-04T20:00:00.000Z",
  "queue": {
    "status": "healthy",
    "queue": "notifications",
    "jobs": {
      "waiting": 5,
      "active": 2,
      "completed": 150,
      "failed": 3,
      "delayed": 0
    }
  },
  "uptime": 3600.5,
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  }
}
```

#### GET /ready
Kubernetes readiness probe.

#### GET /live
Kubernetes liveness probe.

### Notification Endpoints

All notification endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

#### POST /api/notifications/send
Send a basic notification.

**Request Body:**
```json
{
  "type": "email",
  "contact": "user@example.com",
  "message": "Your notification message"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f191e810c19729de860ea",
  "type": "email",
  "message": "Your notification message",
  "status": "pending",
  "createdAt": "2024-01-04T20:00:00.000Z",
  "updatedAt": "2024-01-04T20:00:00.000Z"
}
```

#### POST /api/notifications/template/welcome
Send a welcome email using the predefined template.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "John Doe",
  "shopUrl": "https://shopsphere.com"
}
```

#### POST /api/notifications/template/order-confirmation
Send an order confirmation email.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "orderId": "ORD-12345",
  "orderDate": "2024-01-04",
  "total": "99.99"
}
```

#### POST /api/notifications/template/shipping
Send a shipping notification.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "orderId": "ORD-12345",
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "UPS",
  "trackingUrl": "https://www.ups.com/track?tracknum=1Z999AA10123456784",
  "expectedDelivery": "2024-01-10"
}
```

#### POST /api/notifications/template/payment-confirmation
Send a payment confirmation email.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "orderId": "ORD-12345",
  "amount": "99.99",
  "paymentMethod": "Credit Card",
  "transactionId": "txn_1234567890",
  "paymentDate": "2024-01-04"
}
```

#### GET /api/notifications/:userId
Get all notifications for a user.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "type": "email",
    "message": "Your notification message",
    "status": "sent",
    "createdAt": "2024-01-04T20:00:00.000Z",
    "updatedAt": "2024-01-04T20:00:00.000Z"
  }
]
```

#### PATCH /api/notifications/:id/read
Mark a notification as read.

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f191e810c19729de860ea",
  "type": "email",
  "message": "Your notification message",
  "status": "sent",
  "createdAt": "2024-01-04T20:00:00.000Z",
  "updatedAt": "2024-01-04T20:00:30.000Z"
}
```

## Email Templates

The service includes pre-built HTML email templates:

1. **welcome** - Welcome new users
2. **orderConfirmation** - Confirm order placement
3. **orderShipped** - Notify about shipping with tracking
4. **passwordReset** - Password reset instructions
5. **paymentConfirmation** - Payment receipt
6. **generic** - Custom notification with flexible content

### Template Variables

Each template accepts specific data variables:

**Welcome Template:**
- `name` - User's name
- `shopUrl` - Link to shop

**Order Confirmation:**
- `orderId` - Order ID
- `orderDate` - Date of order
- `total` - Order total amount

**Order Shipped:**
- `orderId` - Order ID
- `trackingNumber` - Tracking number
- `carrier` - Shipping carrier
- `trackingUrl` - Link to track package
- `expectedDelivery` - Expected delivery date

## Queue Configuration

### Job Options

- **Attempts:** 3 (with exponential backoff)
- **Backoff Delay:** Starting at 2 seconds
- **Completed Job Retention:** Last 100 jobs
- **Failed Job Retention:** All failed jobs kept for analysis
- **Lock Duration:** 30 seconds
- **Stalled Check Interval:** 30 seconds

### Queue Events

The queue emits various events for monitoring:

- `completed` - Job completed successfully
- `failed` - Job failed
- `error` - Queue error
- `waiting` - Job waiting to be processed
- `active` - Job started processing
- `stalled` - Job has stalled
- `progress` - Job progress update

## Error Handling

### Retry Strategy

Failed notifications are automatically retried up to 3 times with exponential backoff:

1. **First retry:** After 2 seconds
2. **Second retry:** After 4 seconds
3. **Third retry:** After 8 seconds

### Error Logging

All errors are logged with context:

```
[Queue] ✗ Job 123 failed after attempt 1/3: API Error 429 - Rate limit exceeded
```

### Failed Job Storage

Failed jobs are retained in the queue for analysis. They can be:
- Inspected via the queue's admin interface
- Retried manually
- Cleaned up periodically

## Monitoring

### Metrics Available

The `/health/detailed` endpoint provides:

- **Queue Status:** healthy/unhealthy
- **Job Counts:** waiting, active, completed, failed, delayed
- **Service Uptime:** Process uptime in seconds
- **Memory Usage:** RSS, heap total, heap used, external

### Logging

Structured logs with prefixes:

- `[Redis]` - Redis connection events
- `[Queue]` - Bull queue events
- `[Worker]` - Worker processing events
- `[Brevo]` - Brevo API calls
- `[Email]`, `[SMS]`, `[WhatsApp]` - Channel-specific logs

### Health Checks for Kubernetes

- **Liveness:** `/live` - Always returns 200 if process is running
- **Readiness:** `/ready` - Returns 200 when queue is accessible

## Deployment

### Docker Deployment

```bash
docker-compose up -d notification-service
```

### Kubernetes Deployment

Example deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: shopsphere/notification-service:latest
        ports:
        - containerPort: 5004
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: mongo-uri
        - name: REDIS_URL
          value: redis://redis-service:6379
        - name: BREVO_API_KEY
          valueFrom:
            secretKeyRef:
              name: brevo-credentials
              key: api-key
        livenessProbe:
          httpGet:
            path: /live
            port: 5004
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5004
          initialDelaySeconds: 10
          periodSeconds: 5
```

## Graceful Shutdown

The service handles shutdown signals gracefully:

1. **SIGTERM/SIGINT received**
2. Stop accepting new HTTP requests
3. Close HTTP server
4. Close notification queue (wait for active jobs)
5. Close Redis connections
6. Close MongoDB connection
7. Exit process

Timeout: 30 seconds (force exit if not completed)

## Testing

### Integration Tests

Run integration tests with real Redis and MongoDB:

```bash
npm test -- tests/integration/notificationService.integration.test.js
```

### Manual Testing

Using curl:

```bash
# Health check
curl http://localhost:5004/health

# Send notification (requires auth token)
curl -X POST http://localhost:5004/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "email",
    "contact": "test@example.com",
    "message": "Test notification"
  }'

# Send welcome email
curl -X POST http://localhost:5004/api/notifications/template/welcome \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "name": "John Doe"
  }'
```

## Troubleshooting

### Common Issues

**Issue: Queue jobs not processing**
- Check Redis connection: `redis-cli ping`
- Verify worker is running: Check logs for `[Worker] Notification worker initialized`
- Check queue health: `GET /health/detailed`

**Issue: Notifications not sending**
- Verify Brevo API key is valid
- Check Brevo API quota/limits
- Review failed jobs in queue for error details

**Issue: High memory usage**
- Check completed job retention settings
- Clean up old completed jobs
- Monitor job processing rate

### Logs Analysis

Enable debug logging:
```env
NODE_ENV=development
```

View logs:
```bash
docker-compose logs -f notification-service
```

## Performance Considerations

### Scaling

- **Horizontal Scaling:** Run multiple instances (share same Redis queue)
- **Queue Concurrency:** Configure in queue settings
- **Redis Connection Pooling:** Handled automatically by ioredis

### Rate Limiting

Brevo API has rate limits:
- **Email:** 300 requests/minute
- **SMS:** 300 requests/minute

Configure queue processing rate accordingly.

### Database Optimization

- Indexes created on `userId`, `status`, and `createdAt`
- Consider archiving old notifications after 90 days
- Monitor MongoDB performance

## Security

### Best Practices

1. **API Keys:** Store Brevo API key in secrets, never commit
2. **Authentication:** All endpoints require valid JWT
3. **TLS:** Use HTTPS in production
4. **Redis:** Enable Redis AUTH in production
5. **MongoDB:** Use authentication and encryption

### Data Privacy

- Email addresses and phone numbers are stored
- Consider GDPR compliance for user data
- Implement data retention policies

## Support

For issues and questions:
- GitHub Issues: [oyugijr/shop_sphere](https://github.com/oyugijr/shop_sphere/issues)
- Documentation: `/docs`

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-04  
**Author:** ShopSphere Team
