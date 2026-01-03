# ShopSphere Security Best Practices

This document outlines security best practices and guidelines for developing and deploying ShopSphere securely.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [API Security](#api-security)
4. [Infrastructure Security](#infrastructure-security)
5. [Database Security](#database-security)
6. [Secrets Management](#secrets-management)
7. [Security Monitoring](#security-monitoring)
8. [Incident Response](#incident-response)
9. [Compliance Considerations](#compliance-considerations)

---

## Authentication & Authorization

### JWT Token Security

**Implementation:**

```javascript
// Generate secure JWT tokens
const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d',
      algorithm: 'HS256',
      issuer: 'shopsphere',
      audience: 'shopsphere-api'
    }
  );
};
```

**Best Practices:**

- ✅ Use strong, random JWT secrets (minimum 32 characters)
- ✅ Set reasonable expiration times (7 days maximum)
- ✅ Include only necessary claims in tokens
- ✅ Validate tokens on every protected route
- ✅ Use HTTPS to prevent token interception
- ❌ Never store sensitive data in JWT payload
- ❌ Don't use the same secret across environments

### Password Security

**Current Implementation:**

```javascript
const bcrypt = require('bcryptjs');

// Hash password with salt rounds of 10
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isMatch = await bcrypt.compare(password, user.password);
```

**Password Requirements:**

- Minimum 8 characters
- Mix of uppercase and lowercase letters
- At least one number
- At least one special character

**Enhanced Password Validation:**

```javascript
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!hasUpperCase) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }
  if (!hasLowerCase) {
    return { valid: false, error: 'Password must contain lowercase letter' };
  }
  if (!hasNumbers) {
    return { valid: false, error: 'Password must contain a number' };
  }
  if (!hasSpecialChar) {
    return { valid: false, error: 'Password must contain a special character' };
  }
  
  return { valid: true };
};
```

### Role-Based Access Control (RBAC)

**Middleware Implementation:**

```javascript
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

// Usage
router.delete('/api/products/:id', 
  authMiddleware, 
  checkRole('admin'), 
  deleteProduct
);
```

---

## Data Protection

### Input Validation and Sanitization

**Always validate and sanitize user input:**

```javascript
const validator = require('validator');
const mongoSanitize = require('express-mongo-sanitize');

// Sanitize to prevent NoSQL injection
app.use(mongoSanitize());

// Validate email
const validateEmail = (email) => {
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }
  return validator.normalizeEmail(email);
};

// Sanitize strings
const sanitizeString = (str) => {
  return validator.escape(validator.trim(str));
};

// Validate and sanitize product data
const validateProductData = (data) => {
  return {
    name: sanitizeString(data.name),
    description: sanitizeString(data.description),
    price: validator.isFloat(String(data.price), { min: 0 }) 
      ? parseFloat(data.price) 
      : null,
    stock: validator.isInt(String(data.stock), { min: 0 }) 
      ? parseInt(data.stock) 
      : null,
    category: sanitizeString(data.category)
  };
};
```

### XSS Prevention

**Prevent Cross-Site Scripting attacks:**

```javascript
const helmet = require('helmet');
const xss = require('xss-clean');

// Use Helmet for security headers
app.use(helmet());

// Data sanitization against XSS
app.use(xss());

// Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  }
}));
```

### SQL/NoSQL Injection Prevention

**MongoDB Injection Protection:**

```javascript
// Use parameterized queries
const product = await Product.findOne({ _id: productId });

// Avoid string concatenation
// ❌ Bad
const query = `{ "email": "${userInput}" }`;

// ✅ Good
const user = await User.findOne({ email: userInput });

// Use mongoose sanitization
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
```

### Data Encryption

**Encrypt Sensitive Data at Rest:**

```javascript
const crypto = require('crypto');

class Encryption {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }
  
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  
  decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// Usage for sensitive fields
const encryption = new Encryption();
user.ssn = encryption.encrypt(ssn);
```

---

## API Security

### Rate Limiting

**Current Implementation:**

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
```

**Enhanced Rate Limiting:**

```javascript
// Different limits for different endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.'
});

app.use('/api/auth/login', authLimiter);

// User-based rate limiting
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

const userLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),
  windowMs: 60 * 1000,
  max: async (req) => {
    // Different limits based on user role
    if (req.user?.role === 'admin') return 1000;
    if (req.user?.role === 'premium') return 500;
    return 100;
  }
});
```

### CORS Configuration

**Production CORS Setup:**

```javascript
const cors = require('cors');

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### HTTPS Enforcement

**Redirect HTTP to HTTPS:**

```javascript
const enforceHTTPS = (req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
};

app.use(enforceHTTPS);

// HSTS Header
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));
```

### API Key Authentication (for service-to-service)

```javascript
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'API key required' 
    });
  }
  
  // Verify API key (store hashed in database)
  const hashedKey = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
  
  if (hashedKey !== process.env.INTERNAL_API_KEY_HASH) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid API key' 
    });
  }
  
  next();
};
```

---

## Infrastructure Security

### Docker Security

**Secure Dockerfile:**

```dockerfile
# Use specific version, not latest
FROM node:16-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application files
COPY --chown=nodejs:nodejs . .

# Use non-root user
USER nodejs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "app.js"]
```

**Docker Compose Security:**

```yaml
version: '3.8'

services:
  user-service:
    build: ./user-service
    # Don't run as root
    user: "nodejs"
    # Read-only root filesystem
    read_only: true
    # Limit resources
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    # Security options
    security_opt:
      - no-new-privileges:true
    # Drop capabilities
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### Network Security

**Service Isolation:**

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access

services:
  api-gateway:
    networks:
      - frontend
      - backend
  
  user-service:
    networks:
      - backend  # Only internal network
```

---

## Database Security

### MongoDB Security Checklist

**Authentication & Authorization:**

```javascript
// Connection with authentication
const MONGO_URI = 'mongodb://username:password@host:27017/shopSphere?authSource=admin';

// Create database users with limited privileges
// In MongoDB shell:
use shopSphere
db.createUser({
  user: "shopsphere_app",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "shopSphere" }
  ]
});
```

**Connection Security:**

```javascript
// Use TLS/SSL
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: true,
  sslCA: fs.readFileSync('/path/to/ca-cert.pem'),
});
```

**Data Backup:**

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
MONGO_URI="mongodb://username:password@localhost:27017"

# Create backup
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/backup_$DATE"

# Encrypt backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/backup_$DATE"
openssl enc -aes-256-cbc -salt -in "$BACKUP_DIR/backup_$DATE.tar.gz" \
  -out "$BACKUP_DIR/backup_$DATE.tar.gz.enc" -k "$BACKUP_PASSWORD"

# Remove unencrypted backup
rm -rf "$BACKUP_DIR/backup_$DATE" "$BACKUP_DIR/backup_$DATE.tar.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz.enc" s3://shopsphere-backups/
```

---

## Secrets Management

### Environment Variables

**Never commit secrets to version control:**

```bash
# .gitignore
.env
.env.local
.env.production
*.key
*.pem
secrets/
```

**Use Secret Managers in Production:**

**AWS Secrets Manager:**

```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

async function getSecret(secretName) {
  try {
    const data = await secretsManager.getSecretValue({ 
      SecretId: secretName 
    }).promise();
    return JSON.parse(data.SecretString);
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
}

// Usage
const secrets = await getSecret('shopsphere/prod/db-credentials');
const MONGO_URI = secrets.MONGO_URI;
```

**HashiCorp Vault:**

```javascript
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

async function getVaultSecret(path) {
  const result = await vault.read(path);
  return result.data;
}

// Usage
const secrets = await getVaultSecret('secret/data/shopsphere/prod');
```

---

## Security Monitoring

### Logging Security Events

```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log security events
const logSecurityEvent = (event, details) => {
  securityLogger.info({
    timestamp: new Date().toISOString(),
    event,
    ...details
  });
};

// Examples
logSecurityEvent('failed_login', {
  email: req.body.email,
  ip: req.ip,
  userAgent: req.get('user-agent')
});

logSecurityEvent('unauthorized_access', {
  userId: req.user.id,
  resource: req.path,
  method: req.method
});
```

### Security Headers

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
}));
```

### Vulnerability Scanning

```bash
# Scan dependencies for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Scan Docker images
docker scan shopsphere-user-service:latest

# Use Snyk for continuous monitoring
snyk test
snyk monitor
```

---

## Incident Response

### Security Incident Response Plan

#### **1. Detection**

- Monitor security logs
- Set up alerts for suspicious activities
- Regular security audits

#### **2. Containment**

```bash
# Immediately revoke compromised credentials
# Rotate JWT secrets
# Block malicious IP addresses
# Isolate affected services
```

#### **3. Investigation**

- Analyze logs
- Identify scope of breach
- Document findings

#### **4. Remediation**

- Patch vulnerabilities
- Update dependencies
- Reset compromised credentials
- Notify affected users

#### **5. Prevention**

- Implement additional security measures
- Update security policies
- Conduct security training

---

## Compliance Considerations

### GDPR Compliance

**Data Protection:**

- User consent for data collection
- Right to be forgotten implementation
- Data portability
- Privacy policy

**Implementation:**

```javascript
// Delete user data (right to be forgotten)
const deleteUserData = async (userId) => {
  await User.findByIdAndDelete(userId);
  await Order.deleteMany({ userId });
  await Notification.deleteMany({ userId });
  
  // Anonymize data in other collections
  await Review.updateMany(
    { userId },
    { $set: { userId: null, userName: 'Anonymous' } }
  );
};
```

### PCI DSS Compliance (for payment processing)

**Never store:**

- Full card numbers
- CVV/CVC codes
- PIN numbers

**Use payment processors:**

- Stripe
- PayPal
- Square

---

## Security Checklist

### Development

- [ ] Use environment variables for secrets
- [ ] Implement input validation
- [ ] Use parameterized queries
- [ ] Enable security headers
- [ ] Implement rate limiting
- [ ] Use HTTPS in all environments

### Deployment

- [ ] Change all default credentials
- [ ] Use strong, unique passwords
- [ ] Enable firewall
- [ ] Configure security groups
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Operations

- [ ] Regular backups
- [ ] Incident response plan
- [ ] Security training
- [ ] Vulnerability scanning
- [ ] Penetration testing
- [ ] Log monitoring

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

---

**Report security vulnerabilities:** <security@shopsphere.com> (if applicable)
