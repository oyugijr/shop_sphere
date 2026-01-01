# ShopSphere Deployment Guide

This guide covers deployment strategies and best practices for deploying ShopSphere to production environments.

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Cloud Platform Deployment](#cloud-platform-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Pre-Deployment Checklist](#pre-deployment-checklist)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Rollback Procedures](#rollback-procedures)

---

## Deployment Options

ShopSphere can be deployed using several strategies:

| Option | Best For | Complexity | Scalability |
|--------|----------|------------|-------------|
| Docker Compose | Development, Small Production | Low | Limited |
| Docker Swarm | Medium-scale Production | Medium | Good |
| Kubernetes | Enterprise, Large-scale | High | Excellent |
| Cloud Services | Quick deployment | Medium | Excellent |

---

## Docker Deployment

### Single Server Deployment

#### Prerequisites
- Ubuntu 20.04+ or equivalent Linux distribution
- Docker 20.10+
- Docker Compose 1.29+
- 4GB RAM minimum (8GB recommended)
- 20GB disk space

#### Step 1: Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Step 2: Clone and Configure

```bash
# Clone repository
git clone https://github.com/oyugijr/shop_sphere.git
cd shop_sphere

# Configure environment
cp .env.example .env
nano .env  # Edit with your configuration
```

#### Step 3: Deploy Services

```bash
# Start all services
docker-compose up -d

# Verify deployment
docker-compose ps
curl http://localhost:3000/health
```

#### Step 4: Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific application ports (for development)
sudo ufw allow 3000/tcp
sudo ufw enable
```

### Docker Swarm Deployment

For multi-server deployment with load balancing:

```bash
# Initialize swarm on manager node
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml shopsphere

# Scale services
docker service scale shopsphere_product-service=3
docker service scale shopsphere_order-service=3

# Check services
docker stack services shopsphere
```

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (v1.20+)
- kubectl configured
- Helm 3+ (optional)

### Step 1: Create Namespace

```bash
kubectl create namespace shopsphere
kubectl config set-context --current --namespace=shopsphere
```

### Step 2: Deploy MongoDB

```yaml
# mongodb-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:latest
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: mongo-storage
          mountPath: /data/db
      volumes:
      - name: mongo-storage
        persistentVolumeClaim:
          claimName: mongo-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
```

### Step 3: Deploy Services

```yaml
# user-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: your-registry/shopsphere-user-service:latest
        ports:
        - containerPort: 5001
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: shopsphere-secrets
              key: mongo-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: shopsphere-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 5001
    targetPort: 5001
```

### Step 4: Deploy Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shopsphere-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: api.shopsphere.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

### Step 5: Apply Configurations

```bash
# Create secrets
kubectl create secret generic shopsphere-secrets \
  --from-literal=mongo-uri="mongodb://mongodb:27017/shopSphere" \
  --from-literal=jwt-secret="your-secure-secret"

# Deploy all services
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f user-service-deployment.yaml
kubectl apply -f product-service-deployment.yaml
kubectl apply -f order-service-deployment.yaml
kubectl apply -f notification-service-deployment.yaml
kubectl apply -f api-gateway-deployment.yaml
kubectl apply -f ingress.yaml

# Verify deployment
kubectl get pods
kubectl get services
kubectl get ingress
```

---

## Cloud Platform Deployment

### AWS Deployment (ECS with Fargate)

#### Step 1: Push Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t shopsphere-user-service ./user-service
docker tag shopsphere-user-service:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/shopsphere-user-service:latest

# Push to ECR
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/shopsphere-user-service:latest
```

#### Step 2: Create ECS Cluster and Task Definitions

Use AWS Console or CloudFormation to:
1. Create ECS Cluster
2. Define Task Definitions for each service
3. Create Services with Load Balancers
4. Configure Auto Scaling

### Google Cloud Platform (GKE)

```bash
# Create cluster
gcloud container clusters create shopsphere-cluster \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --region=us-central1

# Get credentials
gcloud container clusters get-credentials shopsphere-cluster --region=us-central1

# Deploy using kubectl (as shown in Kubernetes section)
```

### Azure (AKS)

```bash
# Create resource group
az group create --name shopsphere-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group shopsphere-rg \
  --name shopsphere-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group shopsphere-rg --name shopsphere-cluster

# Deploy using kubectl
```

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create apps for each service
heroku create shopsphere-api-gateway
heroku create shopsphere-user-service
heroku create shopsphere-product-service
heroku create shopsphere-order-service
heroku create shopsphere-notification-service

# Set environment variables
heroku config:set MONGO_URI="your-mongodb-atlas-uri" --app shopsphere-user-service
heroku config:set JWT_SECRET="your-secret" --app shopsphere-user-service

# Deploy
git push heroku main
```

---

## Environment Configuration

### Production Environment Variables

```bash
# Application Environment
NODE_ENV=production

# Database (Use MongoDB Atlas or managed service)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopSphere?retryWrites=true&w=majority

# Security
JWT_SECRET=generate-a-very-secure-random-string-here
JWT_EXPIRE=7d

# Service URLs (adjust based on deployment)
USER_SERVICE_URL=http://user-service:5001
PRODUCT_SERVICE_URL=http://product-service:5002
ORDER_SERVICE_URL=http://order-service:5003
NOTIFICATION_SERVICE_URL=http://notification-service:5004

# Redis
REDIS_URL=redis://your-redis-host:6379

# Email Service (Brevo/SendGrid)
BREVO_API_KEY=your-production-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=YourCompany

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Secrets Management

**AWS Secrets Manager:**
```bash
# Store secrets
aws secretsmanager create-secret \
  --name shopsphere/prod/mongo-uri \
  --secret-string "your-mongo-uri"

# Retrieve in application
const secret = await secretsManager.getSecretValue({SecretId: 'shopsphere/prod/mongo-uri'}).promise();
```

**HashiCorp Vault:**
```bash
# Store secrets
vault kv put secret/shopsphere/prod mongo-uri="your-uri" jwt-secret="your-secret"

# Retrieve in application
const secret = await vault.read('secret/data/shopsphere/prod');
```

---

## Pre-Deployment Checklist

### Security
- [ ] Change all default passwords and secrets
- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS/TLS for all services
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Configure CORS for production domains only
- [ ] Enable security headers
- [ ] Scan images for vulnerabilities

### Database
- [ ] Use managed database service (MongoDB Atlas, AWS DocumentDB)
- [ ] Configure database backups
- [ ] Set up database replication
- [ ] Create database indexes
- [ ] Test database connection

### Monitoring
- [ ] Set up logging aggregation
- [ ] Configure health checks
- [ ] Set up alerting
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring

### Testing
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Perform load testing
- [ ] Test failover scenarios
- [ ] Verify backups work

### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbooks for operations
- [ ] Document rollback procedures

---

## Post-Deployment Steps

### 1. Verify Deployment

```bash
# Check service health
curl https://api.yourdomain.com/health

# Check all services
curl https://api.yourdomain.com/api/users/health
curl https://api.yourdomain.com/api/products/health
curl https://api.yourdomain.com/api/orders/health
curl https://api.yourdomain.com/api/notifications/health
```

### 2. Monitor Services

```bash
# Check logs
docker-compose logs -f  # Docker
kubectl logs -f deployment/user-service  # Kubernetes

# Check resource usage
docker stats  # Docker
kubectl top pods  # Kubernetes
```

### 3. Set Up Monitoring Alerts

Configure alerts for:
- Service downtime
- High error rates
- High response times
- Resource exhaustion (CPU, memory, disk)
- Database connection issues

### 4. Create Initial Admin User

```bash
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@yourdomain.com",
    "password": "secure-password",
    "role": "admin"
  }'
```

### 5. Test Critical Flows

- User registration and login
- Product creation and listing
- Order creation and processing
- Notification sending

---

## Rollback Procedures

### Docker Deployment Rollback

```bash
# Stop current deployment
docker-compose down

# Checkout previous version
git checkout <previous-tag>

# Rebuild and deploy
docker-compose up -d --build
```

### Kubernetes Deployment Rollback

```bash
# Check deployment history
kubectl rollout history deployment/user-service

# Rollback to previous version
kubectl rollout undo deployment/user-service

# Rollback to specific revision
kubectl rollout undo deployment/user-service --to-revision=2

# Verify rollback
kubectl rollout status deployment/user-service
```

### Database Migration Rollback

```bash
# If using migration tool
npm run migrate:rollback

# Manual rollback
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/shopSphere" --drop /path/to/backup
```

---

## Production Best Practices

### High Availability
- Deploy multiple replicas of each service (minimum 3)
- Use load balancers
- Deploy across multiple availability zones
- Set up database replication

### Performance
- Enable caching (Redis)
- Use CDN for static assets
- Optimize database queries
- Implement connection pooling

### Security
- Use HTTPS everywhere
- Implement API rate limiting
- Regular security audits
- Keep dependencies updated
- Use Web Application Firewall (WAF)

### Backup and Disaster Recovery
- Automated daily backups
- Test restore procedures regularly
- Document disaster recovery plan
- Keep backups in different regions

### Cost Optimization
- Use auto-scaling based on demand
- Right-size instances
- Use spot instances for non-critical workloads
- Monitor and optimize resource usage

---

## Troubleshooting Deployment Issues

See the [Troubleshooting Guide](TROUBLESHOOTING.md) for common deployment issues and solutions.

---

## Additional Resources

- [Setup Guide](SETUP.md) - Local development setup
- [Monitoring Guide](MONITORING.md) - Production monitoring
- [Security Best Practices](SECURITY.md) - Security guidelines
- [Architecture Guide](ARCHITECTURE.md) - System architecture

---

**Need help with deployment?** Open an issue on GitHub or contact the maintainers.
