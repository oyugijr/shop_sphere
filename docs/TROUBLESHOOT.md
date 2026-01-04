# ShopSphere Troubleshooting Guide

This guide helps you diagnose and resolve common issues in ShopSphere.

## Table of Contents

1. [General Debugging](#general-debugging)
2. [Service-Specific Issues](#service-specific-issues)
3. [Database Issues](#database-issues)
4. [Docker and Container Issues](#docker-and-container-issues)
5. [Network and Connection Issues](#network-and-connection-issues)
6. [Authentication Issues](#authentication-issues)
7. [Performance Issues](#performance-issues)
8. [Production Issues](#production-issues)

---

## General Debugging

### Enable Debug Logging

```bash
# Set environment variable
export DEBUG=*

# Or for specific services
export DEBUG=express:*,shopsphere:*
```

### Check Service Health

```bash
# Check all service health endpoints
curl http://localhost:3000/health
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
curl http://localhost:5004/health
```

### View Logs

```bash
# Docker Compose
docker-compose logs -f                  # All services
docker-compose logs -f user-service     # Specific service
docker-compose logs --tail=100 user-service  # Last 100 lines

# Kubernetes
kubectl logs -f deployment/user-service
kubectl logs -f pod/user-service-xyz123
kubectl logs --previous pod/user-service-xyz123  # Previous container logs
```

---

## Service-Specific Issues

### API Gateway Issues

#### Problem: Gateway Not Routing Requests

**Symptoms:**

- 502 Bad Gateway errors
- Requests not reaching backend services

**Diagnosis:**

```bash
# Check if services are reachable from gateway
docker exec shopsphere-api-gateway curl http://user-service:5001/health
```

**Solutions:**

1. Verify service URLs in configuration:

```javascript
// src/config/services.js
const services = {
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://user-service:5001',
  // ...
};
```

1. Check Docker network:

```bash
docker network inspect shopsphere-network
```

1. Restart services:

```bash
docker-compose restart api-gateway user-service
```

#### Problem: Rate Limiting Too Strict

**Symptoms:**

- 429 Too Many Requests errors

**Solutions:**

1. Adjust rate limit in `.env`:

```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=200  # Increase limit
```

1. Clear Redis cache if using Redis for rate limiting:

```bash
docker exec -it shopsphere-redis redis-cli FLUSHALL
```

### User Service Issues

#### Problem: Registration Fails

**Symptoms:**

- "User already exists" error
- "Validation failed" errors

**Diagnosis:**

```bash
# Check database for existing user
docker exec -it shopsphere-mongo mongosh shopSphere
db.users.findOne({ email: "test@example.com" })
```

**Solutions:**

1. Validate email format:

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format');
}
```

1. Check for duplicate emails:

```javascript
const existingUser = await User.findOne({ email });
if (existingUser) {
  throw new Error('Email already registered');
}
```

#### Problem: JWT Token Verification Fails

**Symptoms:**

- "Invalid token" errors
- "jwt malformed" errors

**Solutions:**

1. Verify JWT_SECRET is set and consistent:

```bash
# Check environment variable
echo $JWT_SECRET

# Ensure all services use the same secret
docker exec shopsphere-user-service env | grep JWT_SECRET
docker exec shopsphere-api-gateway env | grep JWT_SECRET
```

1. Check token format:

```javascript
// Token should be in format: "Bearer <token>"
const token = req.header('Authorization')?.replace('Bearer ', '');
```

1. Verify token hasn't expired:

```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('Token expires:', new Date(decoded.exp * 1000));
```

### Product Service Issues

#### Problem: Products Not Loading

**Symptoms:**

- Empty product list
- 404 Not Found errors

**Diagnosis:**

```bash
# Check database
docker exec -it shopsphere-mongo mongosh shopSphere
db.products.countDocuments()
db.products.find().limit(5)
```

**Solutions:**

1. Seed database with sample products:

```javascript
// scripts/seed-products.js
const products = [
  {
    name: "Sample Product",
    description: "Description",
    price: 29.99,
    category: "electronics",
    stock: 100
  }
];

await Product.insertMany(products);
```

1. Check product route configuration:

```bash
# Test direct service access
curl http://localhost:5002/api/products
```

### Order Service Issues

#### Problem: Order Creation Fails

**Symptoms:**

- "Product not found" errors
- "Insufficient stock" errors

**Diagnosis:**

```bash
# Check product exists and has stock
docker exec -it shopsphere-mongo mongosh shopSphere
db.products.findOne({ _id: ObjectId("product_id") })
```

**Solutions:**

1. Validate product availability before order:

```javascript
for (const item of items) {
  const product = await Product.findById(item.productId);
  if (!product) {
    throw new Error(`Product ${item.productId} not found`);
  }
  if (product.stock < item.quantity) {
    throw new Error(`Insufficient stock for ${product.name}`);
  }
}
```

1. Use transactions for inventory management:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Create order
  const order = await Order.create([orderData], { session });
  
  // Update inventory
  await Product.updateMany(
    { _id: { $in: productIds } },
    { $inc: { stock: -quantity } },
    { session }
  );
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Notification Service Issues

#### Problem: Emails Not Sending

**Symptoms:**

- Notifications stuck in queue
- "SMTP error" messages

**Diagnosis:**

```bash
# Check Redis queue
docker exec -it shopsphere-redis redis-cli
KEYS notification:*
LLEN notification:queue

# Check notification service logs
docker-compose logs notification-service
```

**Solutions:**

1. Verify email configuration:

```bash
# Check environment variables
docker exec shopsphere-notification-service env | grep -E "BREVO|EMAIL"
```

1. Test email service connectivity:

```javascript
// Test SMTP connection
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: 'your-email',
    pass: process.env.BREVO_API_KEY
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('SMTP Error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});
```

1. Check Redis connection:

```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Connected'));
```

---

## Database Issues

### Problem: Cannot Connect to MongoDB

**Symptoms:**

- "MongoServerError: connect ECONNREFUSED"
- "Authentication failed"

**Diagnosis:**

```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Check MongoDB logs
docker logs shopsphere-mongo

# Test connection
docker exec -it shopsphere-mongo mongosh --eval "db.adminCommand('ping')"
```

**Solutions:**

1. Verify MongoDB is running:

```bash
docker-compose up -d mongodb
```

1. Check connection string:

```env
# For Docker network
MONGO_URI=mongodb://mongodb:27017/shopSphere

# For localhost
MONGO_URI=mongodb://localhost:27017/shopSphere

# For MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopSphere
```

1. Verify network connectivity:

```bash
# From service container
docker exec shopsphere-user-service ping mongodb
docker exec shopsphere-user-service nc -zv mongodb 27017
```

### Problem: Slow Database Queries

**Symptoms:**

- High response times
- Timeout errors

**Diagnosis:**

```javascript
// Enable query logging
mongoose.set('debug', true);

// Analyze slow queries
db.setProfilingLevel(2);
db.system.profile.find().sort({ millis: -1 }).limit(5);
```

**Solutions:**

1. Create indexes:

```javascript
// In model definition
UserSchema.index({ email: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
```

1. Optimize queries:

```javascript
// ❌ Bad: N+1 query problem
const orders = await Order.find({ userId });
for (const order of orders) {
  const product = await Product.findById(order.productId);
}

// ✅ Good: Use populate
const orders = await Order.find({ userId }).populate('items.productId');
```

1. Use projection to limit fields:

```javascript
// Only return needed fields
const users = await User.find({}, 'name email role');
```

### Problem: Database Connection Pool Exhausted

**Symptoms:**

- "Too many connections" errors
- "MongoPoolClearedError"

**Solutions:**

```javascript
// Configure connection pooling
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

---

## Docker and Container Issues

### Problem: Container Keeps Restarting

**Symptoms:**

- Container status shows "Restarting"
- Service not accessible

**Diagnosis:**

```bash
# Check container status
docker ps -a | grep shopsphere

# View container logs
docker logs shopsphere-user-service

# Check exit code
docker inspect shopsphere-user-service | grep -A 3 "State"
```

**Solutions:**

1. Check for application errors:

```bash
# View full logs
docker logs --tail 100 shopsphere-user-service
```

1. Verify dependencies are ready:

```yaml
# docker-compose.yml
services:
  user-service:
    depends_on:
      mongodb:
        condition: service_healthy
```

1. Add health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

### Problem: Port Already in Use

**Symptoms:**

- "bind: address already in use"

**Solutions:**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
# In .env
API_GATEWAY_PORT=3001
```

### Problem: Out of Disk Space

**Symptoms:**

- "No space left on device"

**Solutions:**

```bash
# Check disk usage
df -h

# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove all unused data
docker system prune -a --volumes
```

---

## Network and Connection Issues

### Problem: Services Cannot Communicate

**Symptoms:**

- "ECONNREFUSED" errors
- "getaddrinfo ENOTFOUND" errors

**Diagnosis:**

```bash
# Check Docker network
docker network ls
docker network inspect shopsphere-network

# Test connectivity between containers
docker exec shopsphere-api-gateway ping user-service
docker exec shopsphere-api-gateway curl http://user-service:5001/health
```

**Solutions:**

1. Ensure all services are on the same network:

```yaml
# docker-compose.yml
services:
  api-gateway:
    networks:
      - shopsphere-network
  user-service:
    networks:
      - shopsphere-network

networks:
  shopsphere-network:
    driver: bridge
```

1. Use service names, not localhost:

```javascript
// ❌ Wrong
const USER_SERVICE_URL = 'http://localhost:5001';

// ✅ Correct
const USER_SERVICE_URL = 'http://user-service:5001';
```

### Problem: CORS Errors

**Symptoms:**

- "Access-Control-Allow-Origin" errors in browser console

**Solutions:**

```javascript
// Configure CORS properly
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

---

## Authentication Issues

### Problem: Token Expired

**Symptoms:**

- "jwt expired" errors

**Solutions:**

```javascript
// Implement token refresh mechanism
const refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newToken = generateToken(decoded.id, decoded.role);
    res.json({ success: true, token: newToken });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
};
```

### Problem: Unauthorized Access

**Symptoms:**

- 401 or 403 errors

**Diagnosis:**

```javascript
// Add detailed logging
const authMiddleware = (req, res, next) => {
  console.log('Auth Header:', req.header('Authorization'));
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Token:', token);
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Performance Issues

### Problem: High Response Times

**Diagnosis:**

```javascript
// Add request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  
  next();
});
```

**Solutions:**

1. Implement caching:

```javascript
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

const cacheMiddleware = (duration) => async (req, res, next) => {
  const key = `cache:${req.path}`;
  
  try {
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.originalJson = res.json;
    res.json = (data) => {
      client.setEx(key, duration, JSON.stringify(data));
      res.originalJson(data);
    };
    
    next();
  } catch (error) {
    next();
  }
};

// Use on routes
app.get('/api/products', cacheMiddleware(300), getProducts);
```

1. Use database indexes (see Database Issues section)

2. Optimize queries with pagination:

```javascript
const getProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const products = await Product.find()
    .limit(limit)
    .skip(skip)
    .lean(); // Use lean() for faster queries
    
  res.json({ success: true, data: products });
};
```

---

## Production Issues

### Problem: Memory Leaks

**Diagnosis:**

```bash
# Monitor memory usage
docker stats

# Use Node.js memory profiling
node --inspect app.js

# Or use heap snapshots
const heapdump = require('heapdump');
heapdump.writeSnapshot('./heap-' + Date.now() + '.heapsnapshot');
```

**Solutions:**

1. Avoid memory leaks:

```javascript
// ❌ Bad: Creates memory leak
const cache = {};
app.get('/api/products', async (req, res) => {
  cache[req.params.id] = await Product.findById(req.params.id);
});

// ✅ Good: Use proper caching with expiration
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });
```

1. Close database connections properly:

```javascript
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
```

### Problem: Application Crashes

**Solutions:**

1. Implement error handling:

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, log and continue
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Exit in this case
  process.exit(1);
});
```

1. Use PM2 for process management:

```bash
npm install -g pm2

# Start with PM2
pm2 start app.js --name user-service

# Auto-restart on crashes
pm2 start app.js --name user-service --max-restarts 10
```

---

## Getting More Help

### Enable Verbose Logging

```javascript
// Set log level
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Useful Commands Reference

```bash
# Docker
docker-compose ps                    # List services
docker-compose logs -f <service>     # Follow logs
docker-compose restart <service>     # Restart service
docker-compose down && docker-compose up -d  # Full restart

# Database
docker exec -it shopsphere-mongo mongosh shopSphere
db.users.find()                      # Query users
db.products.countDocuments()         # Count products

# Redis
docker exec -it shopsphere-redis redis-cli
KEYS *                               # List all keys
FLUSHALL                            # Clear all data

# Networking
docker network ls
docker network inspect shopsphere-network
```

### Reporting Issues

When reporting an issue, include:

1. Error message and stack trace
2. Steps to reproduce
3. Environment details (OS, Node version, Docker version)
4. Relevant logs
5. What you've already tried

---

## Additional Resources

- [Setup Guide](SETUP.md)
- [Architecture Documentation](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Monitoring Guide](MONITORING.md)

---

**Still stuck?** Open an issue on GitHub with detailed information about your problem.
