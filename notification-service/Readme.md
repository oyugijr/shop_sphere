# Notification Service

The Notification Service handles email, SMS, and push notifications for ShopSphere using a queue-based architecture.

## Overview

The Notification Service provides:
- **Email Notifications**: Send emails via Brevo (formerly Sendinblue)
- **SMS Notifications**: Send text messages
- **WhatsApp Notifications**: Send WhatsApp messages
- **Queue-Based Processing**: Asynchronous notification handling with Redis
- **Notification History**: Track all sent notifications
- **Retry Mechanism**: Automatic retry for failed notifications

## Port

- **Default**: 5004
- **Configure via**: `NOTIFICATION_SERVICE_PORT` environment variable

## Architecture

```
Application → Redis Queue → Worker → Brevo API → User
                    ↓
               Notification DB
```

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

```
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
