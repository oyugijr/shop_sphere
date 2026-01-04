# Notification Service - Deployment Guide

## Prerequisites

### Required Services
- **MongoDB** (v4.4+) - Database for notification storage
- **Redis** (v6.0+) - Message queue and pub/sub
- **Node.js** (v18+) - Runtime environment

### Required Credentials
- **Brevo API Key** - Get from [Brevo Dashboard](https://app.brevo.com/settings/keys/api)

## Environment Setup

### 1. Create Environment File

Create a `.env` file in the notification-service directory:

```env
# Environment
NODE_ENV=production

# MongoDB
MONGO_URI=mongodb://mongodb:27017/shopSphere

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# Brevo API
BREVO_API_URL=https://api.brevo.com/v3
BREVO_API_KEY=your_actual_brevo_api_key_here
EMAIL_FROM=noreply@shopsphere.com
EMAIL_FROM_NAME=ShopSphere

# Service
PORT=5004

# JWT (for authentication)
JWT_SECRET=your_jwt_secret_here
```

### 2. Obtain Brevo API Key

1. Sign up at [Brevo](https://www.brevo.com/)
2. Go to **Settings → API Keys**
3. Create a new API key
4. Copy the key and add it to `.env` file

### 3. Configure Email Domain

1. Verify your sending domain in Brevo
2. Add SPF and DKIM records to your DNS
3. Update `EMAIL_FROM` in `.env` with verified domain

## Deployment Options

### Option 1: Docker Compose (Recommended)

#### Step 1: Verify Docker Compose Configuration

Ensure `docker-compose.yml` includes:

```yaml
notification-service:
  build: ./notification-service
  container_name: shopsphere-notification-service
  ports:
    - "5004:5004"
  depends_on:
    - mongodb
    - redis
  environment:
    - MONGO_URI=${MONGO_URI:-mongodb://mongodb:27017/shopSphere}
    - REDIS_HOST=${REDIS_HOST:-redis}
    - REDIS_PORT=${REDIS_PORT:-6379}
    - REDIS_URL=${REDIS_URL:-redis://redis:6379}
    - BREVO_API_URL=${BREVO_API_URL}
    - BREVO_API_KEY=${BREVO_API_KEY}
    - EMAIL_FROM=${EMAIL_FROM}
    - EMAIL_FROM_NAME=${EMAIL_FROM_NAME}
    - JWT_SECRET=${JWT_SECRET}
    - NODE_ENV=${NODE_ENV:-production}
  networks:
    - shopsphere-network
  restart: unless-stopped

redis:
  image: redis:alpine
  container_name: shopsphere-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  networks:
    - shopsphere-network
  volumes:
    - redis_data:/data

volumes:
  redis_data:
```

#### Step 2: Deploy

```bash
# Navigate to project root
cd /path/to/shop_sphere

# Start the notification service with dependencies
docker-compose up -d notification-service redis mongodb

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f notification-service
```

#### Step 3: Verify Health

```bash
# Health check
curl http://localhost:5004/health

# Detailed health check
curl http://localhost:5004/health/detailed
```

### Option 2: Standalone Deployment

#### Step 1: Install Dependencies

```bash
cd notification-service
npm install --production
```

#### Step 2: Start External Services

Ensure MongoDB and Redis are running:

```bash
# Start MongoDB (if not running)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start Redis (if not running)
docker run -d -p 6379:6379 --name redis redis:alpine
```

#### Step 3: Start the Service

```bash
# Development
npm run dev

# Production
NODE_ENV=production npm start
```

### Option 3: Kubernetes Deployment

#### Step 1: Create Secrets

```bash
kubectl create secret generic notification-service-secrets \
  --from-literal=mongo-uri='mongodb://mongodb-service:27017/shopSphere' \
  --from-literal=brevo-api-key='your_brevo_api_key' \
  --from-literal=jwt-secret='your_jwt_secret'
```

#### Step 2: Apply Deployment

Create `k8s/notification-service.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: notification-service-config
data:
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  EMAIL_FROM: "noreply@shopsphere.com"
  EMAIL_FROM_NAME: "ShopSphere"
  BREVO_API_URL: "https://api.brevo.com/v3"
  NODE_ENV: "production"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  labels:
    app: notification-service
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
          name: http
        env:
        - name: PORT
          value: "5004"
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: notification-service-secrets
              key: mongo-uri
        - name: BREVO_API_KEY
          valueFrom:
            secretKeyRef:
              name: notification-service-secrets
              key: brevo-api-key
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: notification-service-secrets
              key: jwt-secret
        envFrom:
        - configMapRef:
            name: notification-service-config
        livenessProbe:
          httpGet:
            path: /live
            port: 5004
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 5004
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: notification-service
spec:
  selector:
    app: notification-service
  ports:
  - port: 5004
    targetPort: 5004
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: notification-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: notification-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Step 3: Deploy to Kubernetes

```bash
# Apply configuration
kubectl apply -f k8s/notification-service.yaml

# Verify deployment
kubectl get pods -l app=notification-service
kubectl get svc notification-service

# Check logs
kubectl logs -l app=notification-service -f
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Basic health
curl http://your-domain:5004/health

# Detailed health with metrics
curl http://your-domain:5004/health/detailed
```

Expected response:
```json
{
  "service": "notification-service",
  "status": "healthy",
  "queue": {
    "status": "healthy",
    "jobs": {
      "waiting": 0,
      "active": 0,
      "completed": 0,
      "failed": 0
    }
  }
}
```

### 2. Test Email Sending

```bash
curl -X POST http://your-domain:5004/api/notifications/template/welcome \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

### 3. Monitor Logs

```bash
# Docker Compose
docker-compose logs -f notification-service

# Kubernetes
kubectl logs -l app=notification-service -f

# Look for these indicators:
# ✓ Notification Service running on port 5004
# ✓ Notification worker initialized and listening for events
# [Redis] ✓ Publisher connected
# [Queue] ✓ Notification queue initialized
```

### 4. Monitor Queue Status

```bash
# Connect to Redis
docker exec -it shopsphere-redis redis-cli

# Check queue keys
KEYS bull:notifications:*

# Check waiting jobs count
LLEN bull:notifications:wait

# Check active jobs
LLEN bull:notifications:active
```

## Production Configuration

### 1. Enable Redis Authentication

Update Redis configuration:

```yaml
redis:
  image: redis:alpine
  command: redis-server --requirepass your_redis_password
  environment:
    - REDIS_PASSWORD=your_redis_password
```

Update notification service environment:

```env
REDIS_URL=redis://:your_redis_password@redis:6379
```

### 2. MongoDB Authentication

Update MongoDB with authentication:

```yaml
mongodb:
  image: mongo:latest
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=your_mongodb_password
```

Update notification service:

```env
MONGO_URI=mongodb://admin:your_mongodb_password@mongodb:27017/shopSphere?authSource=admin
```

### 3. TLS/SSL Configuration

For production, use HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name notifications.shopsphere.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://notification-service:5004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Resource Limits

Set appropriate resource limits:

```yaml
notification-service:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

## Monitoring & Alerts

### 1. Set Up Prometheus Metrics (Future Enhancement)

```yaml
# Add to deployment
- name: metrics
  port: 9090
```

### 2. Log Aggregation

Configure centralized logging:

```yaml
notification-service:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

### 3. Health Check Monitoring

Set up monitoring for health endpoints:

- Uptime monitoring for `/health`
- Alert on `/ready` failures
- Track queue depth from `/health/detailed`

## Backup & Recovery

### 1. MongoDB Backup

```bash
# Backup notifications collection
mongodump --uri="mongodb://localhost:27017/shopSphere" \
  --collection=notifications \
  --out=/backup/$(date +%Y%m%d)
```

### 2. Redis Persistence

Enable RDB and AOF in Redis:

```conf
save 900 1
save 300 10
save 60 10000
appendonly yes
```

## Troubleshooting

### Service Won't Start

1. Check environment variables:
   ```bash
   docker-compose config
   ```

2. Verify MongoDB connection:
   ```bash
   mongo mongodb://localhost:27017/shopSphere
   ```

3. Verify Redis connection:
   ```bash
   redis-cli ping
   ```

### Queue Not Processing

1. Check worker logs:
   ```bash
   docker logs shopsphere-notification-service | grep Worker
   ```

2. Verify Redis connection:
   ```bash
   docker exec shopsphere-redis redis-cli PING
   ```

3. Check queue status:
   ```bash
   curl http://localhost:5004/health/detailed
   ```

### Emails Not Sending

1. Verify Brevo API key:
   ```bash
   curl -X GET https://api.brevo.com/v3/account \
     -H "api-key: your_brevo_api_key"
   ```

2. Check Brevo rate limits in dashboard

3. Review failed jobs in queue

## Scaling Guidelines

### Horizontal Scaling

```bash
# Docker Compose
docker-compose up -d --scale notification-service=3

# Kubernetes
kubectl scale deployment notification-service --replicas=5
```

### Performance Tuning

1. **Queue Concurrency**: Adjust Bull queue concurrency
2. **Database Indexes**: Already optimized with compound indexes
3. **Redis Memory**: Monitor and adjust `maxmemory` settings
4. **Worker Count**: Scale based on queue depth

## Security Checklist

- [ ] Brevo API key stored in secrets (not committed)
- [ ] Redis password enabled in production
- [ ] MongoDB authentication enabled
- [ ] TLS/SSL enabled for HTTPS
- [ ] JWT secret is strong and unique
- [ ] Network policies configured (Kubernetes)
- [ ] Resource limits set
- [ ] Health endpoints not exposing sensitive data

## Rollback Procedure

If deployment fails:

```bash
# Docker Compose
docker-compose down notification-service
docker-compose up -d notification-service:previous_version

# Kubernetes
kubectl rollout undo deployment/notification-service
kubectl rollout status deployment/notification-service
```

## Support

For issues during deployment:
- Check logs: `docker-compose logs notification-service`
- Review documentation: [DOCUMENTATION.md](./DOCUMENTATION.md)
- GitHub Issues: [oyugijr/shop_sphere/issues](https://github.com/oyugijr/shop_sphere/issues)

---

**Last Updated:** 2024-01-04  
**Version:** 1.0.0
