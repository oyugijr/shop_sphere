# Deployment Guide - Product Service

This guide covers deploying the Product Service to various environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Cloud Platform Deployment](#cloud-platform-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- Node.js 18+ (for local deployment)
- MongoDB 4.4+ (or MongoDB Atlas account)
- Docker 20.10+ (for containerized deployment)
- Valid JWT secret for authentication

### Recommended
- Reverse proxy (nginx, Traefik)
- SSL/TLS certificates
- Monitoring tools (Prometheus, Grafana)
- Log aggregation (ELK Stack, Datadog)

## Environment Variables

### Required Variables
```env
PORT=5002
MONGO_URI=mongodb://user:pass@host:port/database
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
```

### Optional Variables
```env
CORS_ORIGIN=https://yourdomain.com
```

### Security Recommendations
1. **Never commit secrets** to version control
2. Use **environment-specific** configuration
3. Use **strong, random** JWT secrets (minimum 256 bits)
4. **Rotate secrets** regularly
5. Use **secret management** tools (AWS Secrets Manager, HashiCorp Vault)

## Docker Deployment

### Build Image
```bash
docker build -t product-service:latest .
```

### Run Container
```bash
docker run -d \
  --name product-service \
  -p 5002:5002 \
  -e MONGO_URI="mongodb://mongo:27017/shopSphere" \
  -e JWT_SECRET="your_secret" \
  -e NODE_ENV="production" \
  --restart unless-stopped \
  product-service:latest
```

### Using Docker Compose
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  product-service:
    build: .
    ports:
      - "5002:5002"
    environment:
      - MONGO_URI=mongodb://mongodb:27017/shopSphere
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongodb
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

Run:
```bash
docker-compose up -d
```

## Kubernetes Deployment

### ConfigMap
Create `product-service-configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: product-service-config
data:
  PORT: "5002"
  NODE_ENV: "production"
  CORS_ORIGIN: "*"
```

### Secret
Create `product-service-secret.yaml`:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: product-service-secret
type: Opaque
stringData:
  MONGO_URI: "mongodb://username:password@mongodb:27017/shopSphere"
  JWT_SECRET: "your_production_secret"
```

### Deployment
Create `product-service-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  labels:
    app: product-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: product-service:latest
        ports:
        - containerPort: 5002
        envFrom:
        - configMapRef:
            name: product-service-config
        - secretRef:
            name: product-service-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /liveness
            port: 5002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /readiness
            port: 5002
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service
Create `product-service-service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: product-service
spec:
  selector:
    app: product-service
  ports:
  - protocol: TCP
    port: 5002
    targetPort: 5002
  type: ClusterIP
```

### Apply Resources
```bash
kubectl apply -f product-service-configmap.yaml
kubectl apply -f product-service-secret.yaml
kubectl apply -f product-service-deployment.yaml
kubectl apply -f product-service-service.yaml
```

## Cloud Platform Deployment

### AWS (EC2 + Docker)
```bash
# SSH into EC2 instance
ssh -i key.pem ec2-user@your-instance

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start

# Clone repository and deploy
git clone <your-repo>
cd shop_sphere/product-service
docker build -t product-service .
docker run -d -p 5002:5002 \
  -e MONGO_URI="$MONGO_URI" \
  -e JWT_SECRET="$JWT_SECRET" \
  product-service
```

### AWS (ECS/Fargate)
1. Push image to ECR
2. Create ECS task definition
3. Create ECS service
4. Configure load balancer

### Google Cloud (Cloud Run)
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/product-service

# Deploy to Cloud Run
gcloud run deploy product-service \
  --image gcr.io/PROJECT_ID/product-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGO_URI=$MONGO_URI,JWT_SECRET=$JWT_SECRET
```

### Azure (Container Instances)
```bash
# Create container instance
az container create \
  --resource-group myResourceGroup \
  --name product-service \
  --image product-service:latest \
  --ports 5002 \
  --environment-variables \
    MONGO_URI=$MONGO_URI \
    JWT_SECRET=$JWT_SECRET
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl http://your-host:5002/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "product-service",
  "database": {
    "status": "connected",
    "connected": true
  }
}
```

### 2. Liveness Check
```bash
curl http://your-host:5002/liveness
```

### 3. Readiness Check
```bash
curl http://your-host:5002/readiness
```

### 4. Create Test Product
```bash
curl -X POST http://your-host:5002/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "Testing deployment",
    "price": 99.99,
    "stock": 10,
    "category": "test"
  }'
```

### 5. Get Products
```bash
curl http://your-host:5002/api/products
```

## Monitoring and Maintenance

### Health Monitoring
Set up automated health checks:
- Interval: Every 30 seconds
- Timeout: 10 seconds
- Failure threshold: 3 consecutive failures

### Metrics to Monitor
1. **Response Times**: P50, P95, P99 percentiles
2. **Error Rates**: 4xx and 5xx responses
3. **Request Volume**: Requests per second
4. **Database Performance**: Query times, connection pool
5. **Memory Usage**: Heap usage, GC frequency
6. **Rate Limit Hits**: Monitor 429 responses

### Log Aggregation
Collect and analyze logs:
```bash
# View recent logs
docker logs product-service --tail 100 -f

# Kubernetes logs
kubectl logs -f deployment/product-service
```

### Database Maintenance
- Regular backups (daily recommended)
- Index optimization
- Monitor slow queries
- Connection pool tuning

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
docker logs product-service
kubectl logs deployment/product-service
```

**Common issues:**
- Missing environment variables
- Database connection failure
- Port already in use

### Database Connection Errors

**Symptoms:**
- Health check returns "unhealthy"
- 503 Service Unavailable errors

**Solutions:**
1. Verify MongoDB is running
2. Check connection string
3. Verify network connectivity
4. Check MongoDB authentication

**Test connection:**
```bash
docker exec -it product-service node -e "
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected'))
    .catch(err => console.error(err));
"
```

### High Memory Usage

**Symptoms:**
- Container restarts frequently
- OOM (Out of Memory) errors

**Solutions:**
1. Increase memory limits
2. Check for memory leaks
3. Monitor rate limiter cache size
4. Review database query efficiency

### Rate Limiting Issues

**Symptoms:**
- Users receiving 429 errors frequently

**Solutions:**
1. Adjust rate limits in code
2. Implement Redis-based rate limiting
3. Use CDN for static assets
4. Cache frequently accessed data

### Performance Issues

**Check:**
1. Database indexes are properly created
2. Queries are optimized
3. Connection pool size is adequate
4. Rate limiting is not too aggressive

**Optimize:**
```bash
# Check MongoDB indexes
mongo shopSphere --eval "db.products.getIndexes()"

# Monitor slow queries
mongo shopSphere --eval "db.setProfilingLevel(1, 100)"
```

## Scaling

### Horizontal Scaling
```bash
# Docker Compose
docker-compose up -d --scale product-service=3

# Kubernetes
kubectl scale deployment product-service --replicas=5
```

### Load Balancing
Use a load balancer (nginx, HAProxy, ALB) in front of multiple instances.

Example nginx configuration:
```nginx
upstream product_service {
    least_conn;
    server product-service-1:5002;
    server product-service-2:5002;
    server product-service-3:5002;
}

server {
    listen 80;
    location / {
        proxy_pass http://product_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Use strong JWT secrets
- [ ] Enable MongoDB authentication
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Monitor logs for suspicious activity
- [ ] Regular security audits (`npm audit`)
- [ ] Use environment variables for secrets
- [ ] Implement proper access controls

## Rollback Procedure

### Docker
```bash
# Tag current version
docker tag product-service:latest product-service:backup

# Revert to previous version
docker pull product-service:previous-version
docker stop product-service
docker rm product-service
docker run -d --name product-service product-service:previous-version
```

### Kubernetes
```bash
# Rollback to previous version
kubectl rollout undo deployment/product-service

# Rollback to specific revision
kubectl rollout undo deployment/product-service --to-revision=2
```

## Support

For deployment issues:
1. Check logs first
2. Verify environment variables
3. Test health endpoints
4. Review this guide
5. Open a GitHub issue

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
