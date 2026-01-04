# Notification Service

Production-ready notification service for ShopSphere using queue-based architecture with Bull, Redis, and Brevo API.

## 🚀 Features

- **Email Notifications**: Production-ready HTML email templates
- **SMS Notifications**: Transactional SMS via Brevo
- **WhatsApp Notifications**: WhatsApp business messaging
- **Queue-Based Processing**: Reliable Bull queue with Redis backend
- **Automatic Retries**: Exponential backoff retry strategy (3 attempts)
- **Delivery Tracking**: Full notification history and status tracking
- **Health Monitoring**: Detailed health checks and metrics
- **Graceful Shutdown**: Clean shutdown handling for zero downtime
- **Kubernetes Ready**: Liveness and readiness probes included

## Port

- **Default**: 5004
- **Configure via**: `PORT` environment variable

## Architecture

```sh
HTTP Request → Service → MongoDB (create notification)
                   ↓
         Redis Pub/Sub (publish event)
                   ↓
         Worker (subscribe) → Bull Queue → Process Job
                                              ↓
                                     Brevo API (send)
                                              ↓
                                MongoDB (update status)
```

## Quick Start

### With Docker Compose

```bash
docker-compose up -d notification-service redis mongodb
```

### Standalone

```bash
cd notification-service
npm install
npm start
```

## API Endpoints

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete API reference.

### Core Endpoints

- `POST /api/notifications/send` - Send basic notification
- `GET /api/notifications/:userId` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read

### Template Endpoints

- `POST /api/notifications/template/welcome` - Welcome email
- `POST /api/notifications/template/order-confirmation` - Order confirmation
- `POST /api/notifications/template/shipping` - Shipping notification
- `POST /api/notifications/template/payment-confirmation` - Payment receipt

### Health & Monitoring

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with queue metrics
- `GET /ready` - Kubernetes readiness probe
- `GET /live` - Kubernetes liveness probe

## Configuration

### Required Environment Variables

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

## Email Templates

### Available Templates

1. **welcome** - Welcome new users
2. **orderConfirmation** - Order confirmation with details
3. **orderShipped** - Shipping notification with tracking
4. **passwordReset** - Password reset with security notice
5. **paymentConfirmation** - Payment receipt with transaction details
6. **generic** - Custom flexible template

### Using Templates

```bash
curl -X POST http://localhost:5004/api/notifications/template/order-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "customer@example.com",
    "orderId": "ORD-12345",
    "orderDate": "2024-01-04",
    "total": "99.99"
  }'
```

## Database Schema

### Notification Model

```javascript
{
  userId: ObjectId,              // Required, indexed
  type: String,                  // email, sms, whatsapp
  message: String,               // Required
  status: String,                // pending, sent, failed (indexed)
  metadata: Mixed,               // Flexible metadata storage
  attempts: Number,              // Number of delivery attempts
  lastAttemptAt: Date,           // Last attempt timestamp
  createdAt: Date,               // Auto-generated
  updatedAt: Date                // Auto-generated
}
```

### Indexes

- `userId + createdAt` (compound index for efficient user queries)
- `status + createdAt` (compound index for status filtering)

## Queue System

### Bull Queue Configuration

- **Attempts**: 3 retries with exponential backoff
- **Backoff**: Starting at 2 seconds, doubling each retry
- **Completed Jobs**: Keep last 100 for debugging
- **Failed Jobs**: Retained for analysis
- **Lock Duration**: 30 seconds
- **Stalled Check**: Every 30 seconds

### Queue Monitoring

```javascript
// Get queue health status
const health = await notificationQueue.getHealthStatus();
console.log(health);
// Output:
// {
//   status: 'healthy',
//   queue: 'notifications',
//   jobs: { waiting: 5, active: 2, completed: 150, failed: 3, delayed: 0 }
// }
```

## Testing

### Unit Tests (with mocks)

```bash
npm test
```

### Integration Tests (real Redis & MongoDB)

```bash
npm test -- tests/integration/notificationService.integration.test.js
```

### Manual Testing

```bash
# Health check
curl http://localhost:5004/health

# Detailed health
curl http://localhost:5004/health/detailed

# Send notification (requires auth)
curl -X POST http://localhost:5004/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "email",
    "contact": "test@example.com",
    "message": "Test notification"
  }'
```

## Monitoring & Logging

### Structured Logging

All logs include contextual prefixes:

- `[Redis]` - Redis connection events
- `[Queue]` - Bull queue operations
- `[Worker]` - Job processing events
- `[Brevo]` - API calls to Brevo
- `[Email]`, `[SMS]`, `[WhatsApp]` - Channel-specific events

### Example Logs

```
[Redis] ✓ Publisher connected
[Queue] ✓ Notification queue initialized
[Worker] Notification worker initialized and ready to process jobs
[Worker] Received email notification for user 507f191e810c19729de860ea
[Queue] Processing job 1 - email notification for test@example.com
[Brevo] POST /smtp/email
[Brevo] ✓ Response received: 201
[Email] ✓ Email sent to test@example.com - Message ID: abc123
[Queue] ✓ Job 1 completed successfully
```

## Error Handling

### Automatic Retries

Failed jobs are retried automatically with exponential backoff:

1. **First attempt**: Immediate
2. **Second attempt**: After 2 seconds
3. **Third attempt**: After 4 seconds
4. **Fourth attempt**: After 8 seconds

### Failed Job Management

Failed jobs are retained in the queue with full error details for analysis.

```bash
# View failed jobs in Redis
docker exec -it shopsphere-redis redis-cli
> LRANGE bull:notifications:failed 0 -1
```

## Deployment

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5004
CMD ["node", "app.js"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: notification-service
        image: shopsphere/notification-service:latest
        ports:
        - containerPort: 5004
        livenessProbe:
          httpGet:
            path: /live
            port: 5004
        readinessProbe:
          httpGet:
            path: /ready
            port: 5004
```

## Graceful Shutdown

The service handles shutdown signals gracefully:

1. Stop accepting new requests
2. Wait for active jobs to complete
3. Close Redis connections
4. Close MongoDB connection
5. Exit (timeout: 30 seconds)

## Performance

### Scaling

- **Horizontal Scaling**: Multiple instances share the same Redis queue
- **Concurrency**: Configure Bull queue concurrency as needed
- **Rate Limiting**: Respects Brevo API limits (300 requests/minute)

### Optimization Tips

- Monitor queue depth regularly
- Archive old notifications (>90 days)
- Use batch processing for bulk notifications
- Configure appropriate job concurrency

## Troubleshooting

### Queue Not Processing

- Check Redis connection: `redis-cli ping`
- Verify worker is running in logs
- Check queue health: `GET /health/detailed`

### Notifications Not Sending

- Verify Brevo API key is valid
- Check Brevo account status/limits
- Review failed jobs for error messages

### High Memory Usage

- Check completed job retention (currently 100)
- Monitor active job count
- Consider increasing cleanup frequency

## Security

- ✅ API key stored in environment variables
- ✅ JWT authentication required for all endpoints
- ✅ TLS/HTTPS in production
- ✅ Redis AUTH enabled in production
- ✅ MongoDB authentication and encryption

## Documentation

- [DOCUMENTATION.md](./DOCUMENTATION.md) - Complete API and architecture docs
- [Main README](../README.md) - Overall project documentation
- [API Docs](../docs/API.md) - Full API reference

## Future Enhancements

- [ ] Rate limiting per user/IP
- [ ] Notification preferences management
- [ ] Webhook endpoints for delivery confirmations
- [ ] Push notification support (FCM/APNs)
- [ ] Analytics dashboard
- [ ] A/B testing for email campaigns

## Contributing

See [Contributing Guide](../CONTRIBUTING.md)

---

**Version**: 1.0.0  
**Maintained by**: ShopSphere Team  
**License**: MIT


## API Endpoints

### Send Notification (Auth Required)

```http
POST /api/notifications/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_id_here",
  "type": "email",
  "subject": "Order Confirmation",
  "message": "Your order has been confirmed!",
  "metadata": {
    "orderId": "order_id_here",
    "template": "order-confirmation"
  }
}
```

### Get User Notifications (Auth Required)

```http
GET /api/notifications/:userId
Authorization: Bearer {token}
```

### Mark as Read (Auth Required)

```http
PATCH /api/notifications/:id/read
Authorization: Bearer {token}
```

### Health Check

```http
GET /health
```

## Database Schema

### Notification Model

```javascript
{
  userId: ObjectId,              // Reference to User
  type: String,                  // email, sms, push, in-app
  channel: String,               // order, product, account, marketing
  subject: String,
  message: String,               // Required
  status: String,                // pending, sent, failed, read
  metadata: {
    orderId: ObjectId,
    productId: ObjectId,
    template: String,
    variables: Map
  },
  sentAt: Date,
  readAt: Date,
  error: String,
  createdAt: Date,
  updatedAt: Date
}
```

### TTL Index

Notifications are automatically deleted after 90 days using MongoDB TTL index.

## Configuration

```env
PORT=5004
MONGO_URI=mongodb://mongodb:27017/shopSphere
JWT_SECRET=your_jwt_secret

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# Brevo API
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=noreply@shopsphere.com
EMAIL_FROM_NAME=ShopSphere
```

## Project Structure

```sh
notification-service/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── queue.js              # Bull queue configuration
│   ├── controllers/
│   │   └── notificationController.js
│   ├── models/
│   │   └── Notification.js
│   ├── routes/
│   │   └── notificationRoutes.js
│   ├── services/
│   │   ├── notificationService.js
│   │   └── emailService.js
│   ├── workers/
│   │   └── notificationWorker.js # Processes queue
│   ├── repositories/
│   │   └── notificationRepository.js
│   └── utils/
│       └── brevoClient.js        # Brevo API integration
├── tests/
├── app.js
├── Dockerfile
└── package.json
```

## Queue System

### Bull Queue with Redis

The service uses Bull for job queue management:

```javascript
// Add notification to queue
await notificationQueue.add('send-notification', {
  userId,
  type,
  subject,
  message
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});
```

### Worker Process

The worker continuously processes notifications from the queue:

```javascript
notificationQueue.process('send-notification', async (job) => {
  const { userId, type, subject, message } = job.data;
  
  // Send notification via appropriate channel
  await sendNotification({ userId, type, subject, message });
});
```

## Notification Types

### Email

- Welcome emails
- Order confirmations
- Password reset
- Marketing campaigns

### SMS

- Order status updates
- Delivery notifications
- Security alerts

### WhatsApp

- Order updates
- Customer support
- Promotional messages

### In-App

- System notifications
- User mentions
- Activity updates

## Brevo Integration

### Email Sending

```javascript
const brevo = require('@getbrevo/brevo');

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

await apiInstance.sendTransacEmail({
  sender: { email: 'noreply@shopsphere.com', name: 'ShopSphere' },
  to: [{ email: user.email, name: user.name }],
  subject: 'Welcome to ShopSphere!',
  htmlContent: '<html>...</html>'
});
```

## Running Locally

```bash
# With Docker (includes Redis)
docker-compose up notification-service redis

# Standalone (requires Redis)
cd notification-service
npm install
npm start
```

## Testing

```bash
npm test
npm run test:coverage
```

### Manual Testing

```bash
# Send test notification
curl -X POST http://localhost:5004/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "userId": "user_id",
    "type": "email",
    "subject": "Test",
    "message": "Test message"
  }'
```

## Monitoring

### Check Queue Status

```bash
# Connect to Redis
docker exec -it shopsphere-redis redis-cli

# Check queue length
LLEN bull:notification-queue:wait

# View pending jobs
LRANGE bull:notification-queue:wait 0 -1
```

### View Logs

```bash
docker logs shopsphere-notification-service -f
```

## Troubleshooting

### Notifications Not Sending

- Verify Redis is running
- Check Brevo API key is valid
- Verify network connectivity to Brevo
- Check worker process is running

### Queue Backed Up

- Increase worker concurrency
- Scale horizontally (multiple workers)
- Check for failed jobs in Redis

### Email Delivery Fails

- Verify Brevo account status
- Check email address validity
- Review Brevo dashboard for bounces

## Performance Optimization

1. **Batch Processing**: Process multiple notifications together
2. **Caching**: Cache user preferences
3. **Rate Limiting**: Respect Brevo API limits
4. **Concurrency**: Process multiple jobs in parallel

## Security

- Never expose Brevo API key
- Validate user permissions before sending
- Sanitize email content
- Rate limit notification sending

## Future Enhancements

- [ ] Email templates system
- [ ] SMS provider integration
- [ ] Push notification support
- [ ] Notification preferences
- [ ] A/B testing for campaigns
- [ ] Analytics and tracking

## Contributing

See [Contributing Guide](../CONTRIBUTING.md)

## Related Documentation

- [API Documentation](../docs/API.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)

---

**Maintained by**: ShopSphere Team
