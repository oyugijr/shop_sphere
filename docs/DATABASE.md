# ShopSphere Database Guide

This guide covers database schema, optimization, backup strategies, and best practices for MongoDB in ShopSphere.

## Table of Contents

1. [Database Overview](#database-overview)
2. [Schema Design](#schema-design)
3. [Indexes](#indexes)
4. [Query Optimization](#query-optimization)
5. [Backup and Restore](#backup-and-restore)
6. [Data Migration](#data-migration)
7. [Scaling Strategies](#scaling-strategies)
8. [Best Practices](#best-practices)

---

## Database Overview

### Architecture

ShopSphere uses MongoDB as its primary database with a microservices architecture where each service has its own logical database or collection namespace.

```
┌─────────────────────────────────────────┐
│         MongoDB (Port 27017)            │
├─────────────────────────────────────────┤
│  Database: shopSphere                   │
│  ├── Collections:                       │
│  │   ├── users                          │
│  │   ├── products                       │
│  │   ├── orders                         │
│  │   └── notifications                  │
└─────────────────────────────────────────┘
```

### Connection

**Connection String:**
```
mongodb://localhost:27017/shopSphere          # Local
mongodb://mongodb:27017/shopSphere            # Docker
mongodb+srv://user:pass@cluster/shopSphere   # Atlas
```

**Connection Configuration:**
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,          // Connection pool size
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,                // Use IPv4
    });
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

module.exports = connectDB;
```

---

## Schema Design

### User Collection

**Schema Definition:**
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false  // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profile: {
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    avatar: String
  }
}, {
  timestamps: true,  // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual fields
userSchema.virtual('fullProfile').get(function() {
  return {
    name: this.name,
    email: this.email,
    role: this.role,
    ...this.profile
  };
});

module.exports = mongoose.model('User', userSchema);
```

### Product Collection

**Schema Definition:**
```javascript
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'other'],
    index: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean
  }],
  specifications: {
    type: Map,
    of: String
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 }, { unique: true });

// Pre-save hook to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
```

### Order Collection

**Schema Definition:**
```javascript
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,           // Denormalized for history
    price: Number,          // Price at time of order
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: Number
  }],
  totals: {
    subtotal: Number,
    tax: Number,
    shipping: Number,
    discount: Number,
    total: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  payment: {
    method: String,
    status: String,
    transactionId: String,
    paidAt: Date
  },
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  notes: String
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.transactionId': 1 });

// Pre-save hook to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}-${random}`;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  let subtotal = 0;
  
  this.items.forEach(item => {
    item.subtotal = item.price * item.quantity;
    subtotal += item.subtotal;
  });
  
  this.totals.subtotal = subtotal;
  this.totals.tax = subtotal * 0.1;  // 10% tax
  this.totals.shipping = subtotal > 100 ? 0 : 10;
  this.totals.total = subtotal + this.totals.tax + this.totals.shipping - (this.totals.discount || 0);
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);
```

### Notification Collection

**Schema Definition:**
```javascript
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'in-app'],
    required: true
  },
  channel: {
    type: String,
    enum: ['order', 'product', 'account', 'marketing'],
    default: 'account'
  },
  subject: String,
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'read'],
    default: 'pending',
    index: true
  },
  metadata: {
    orderId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    template: String,
    variables: Map
  },
  sentAt: Date,
  readAt: Date,
  error: String
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });

// TTL index to auto-delete old notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Notification', notificationSchema);
```

---

## Indexes

### Index Strategy

**Index Guidelines:**
1. Index fields used in queries
2. Index fields used in sorting
3. Compound indexes for multi-field queries
4. Text indexes for search functionality
5. TTL indexes for auto-expiration

### Creating Indexes

**Via Mongoose:**
```javascript
// In schema definition
userSchema.index({ email: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text' });
```

**Via MongoDB Shell:**
```javascript
// Connect to MongoDB
use shopSphere

// Create single field index
db.users.createIndex({ email: 1 }, { unique: true })

// Create compound index
db.products.createIndex({ category: 1, price: 1 })

// Create text index for search
db.products.createIndex({ name: "text", description: "text" })

// Create TTL index
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 })

// List all indexes
db.users.getIndexes()
db.products.getIndexes()
```

### Monitoring Index Usage

```javascript
// Check index usage
db.products.aggregate([
  { $indexStats: {} }
])

// Explain query plan
db.products.find({ category: "electronics" }).explain("executionStats")

// Find unused indexes
db.products.aggregate([
  { $indexStats: {} },
  {
    $match: {
      "accesses.ops": { $lt: 10 }
    }
  }
])
```

---

## Query Optimization

### Optimization Techniques

**1. Use Projections:**
```javascript
// ❌ Bad: Returns all fields
const users = await User.find({});

// ✅ Good: Returns only needed fields
const users = await User.find({}, 'name email role');
```

**2. Use Lean Queries:**
```javascript
// ❌ Bad: Returns Mongoose documents (slower)
const products = await Product.find({});

// ✅ Good: Returns plain JavaScript objects (faster)
const products = await Product.find({}).lean();
```

**3. Limit Results:**
```javascript
// Always use pagination
const page = req.query.page || 1;
const limit = req.query.limit || 20;
const skip = (page - 1) * limit;

const products = await Product.find()
  .limit(limit)
  .skip(skip)
  .lean();
```

**4. Use Populate Wisely:**
```javascript
// ❌ Bad: Populates all fields
const orders = await Order.find().populate('userId');

// ✅ Good: Populates only needed fields
const orders = await Order.find().populate('userId', 'name email');
```

**5. Avoid N+1 Queries:**
```javascript
// ❌ Bad: N+1 queries
const orders = await Order.find({ userId });
for (const order of orders) {
  const product = await Product.findById(order.productId);
}

// ✅ Good: Single query with populate
const orders = await Order.find({ userId }).populate('items.productId');
```

### Query Performance Analysis

```javascript
// Enable query profiling
mongoose.set('debug', true);

// Analyze slow queries
db.setProfilingLevel(2);
db.system.profile.find({ millis: { $gt: 100 } }).sort({ millis: -1 });

// Explain query execution
const explain = await Product.find({ category: 'electronics' }).explain();
console.log(explain);
```

---

## Backup and Restore

### Automated Backup Script

```bash
#!/bin/bash
# backup-mongodb.sh

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/mongodb"
MONGO_URI="mongodb://localhost:27017"
DATABASE="shopSphere"
S3_BUCKET="shopsphere-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "Starting backup..."
mongodump --uri="$MONGO_URI" --db="$DATABASE" --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Compress backup
echo "Compressing backup..."
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "backup_$TIMESTAMP"

# Encrypt backup
echo "Encrypting backup..."
openssl enc -aes-256-cbc -salt \
  -in "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" \
  -out "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz.enc" \
  -k "$BACKUP_PASSWORD"

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz.enc" "s3://$S3_BUCKET/"

# Cleanup local files older than 7 days
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "backup_*.tar.gz*" -mtime +7 -delete
find $BACKUP_DIR -type d -name "backup_*" -mtime +7 -exec rm -rf {} +

echo "Backup completed successfully!"
```

### Restore from Backup

```bash
#!/bin/bash
# restore-mongodb.sh

BACKUP_FILE=$1
MONGO_URI="mongodb://localhost:27017"
DATABASE="shopSphere"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-mongodb.sh <backup_file>"
  exit 1
fi

# Download from S3 if needed
if [[ $BACKUP_FILE == s3://* ]]; then
  aws s3 cp "$BACKUP_FILE" ./backup.tar.gz.enc
  BACKUP_FILE="./backup.tar.gz.enc"
fi

# Decrypt backup
openssl enc -d -aes-256-cbc \
  -in "$BACKUP_FILE" \
  -out "./backup.tar.gz" \
  -k "$BACKUP_PASSWORD"

# Extract backup
tar -xzf ./backup.tar.gz

# Restore database
mongorestore --uri="$MONGO_URI" --db="$DATABASE" --drop ./backup_*/shopSphere

# Cleanup
rm -rf ./backup* 

echo "Restore completed!"
```

### Cron Job for Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-mongodb.sh

# Weekly full backup on Sunday at 3 AM
0 3 * * 0 /path/to/backup-mongodb.sh --full
```

---

## Data Migration

### Migration Scripts

**Example Migration: Add New Field to Users**

```javascript
// migrations/add-phone-to-users.js
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log('Starting migration...');
  
  // Update all users without phone field
  const result = await User.updateMany(
    { 'profile.phone': { $exists: false } },
    { $set: { 'profile.phone': '' } }
  );
  
  console.log(`Updated ${result.modifiedCount} users`);
  
  await mongoose.disconnect();
}

migrate().catch(console.error);
```

**Run Migrations:**

```bash
node migrations/add-phone-to-users.js
```

---

## Scaling Strategies

### Vertical Scaling

- Increase server resources (CPU, RAM, Disk)
- Use faster storage (SSD)
- Optimize queries and indexes

### Horizontal Scaling

**Replica Sets:**
```javascript
// Connection with replica set
mongoose.connect('mongodb://host1:27017,host2:27017,host3:27017/shopSphere?replicaSet=rs0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

**Sharding:**
```javascript
// Enable sharding
sh.enableSharding("shopSphere")

// Shard collection by userId
sh.shardCollection("shopSphere.orders", { userId: 1 })
```

### Read Scaling

```javascript
// Use read preference for read replicas
mongoose.connect(MONGO_URI, {
  readPreference: 'secondaryPreferred'
});
```

---

## Best Practices

### Schema Design
- ✅ Denormalize when needed for read performance
- ✅ Use references for one-to-many relationships
- ✅ Embed for one-to-few relationships
- ✅ Use virtuals for computed fields
- ❌ Avoid deeply nested documents (max 3-4 levels)

### Indexing
- ✅ Index fields used in queries and sorts
- ✅ Use compound indexes for multi-field queries
- ✅ Monitor index usage
- ❌ Don't over-index (impacts write performance)

### Queries
- ✅ Use projections to limit returned fields
- ✅ Use lean() for read-only operations
- ✅ Implement pagination
- ✅ Use connection pooling
- ❌ Avoid N+1 query problems

### Security
- ✅ Enable authentication
- ✅ Use role-based access control
- ✅ Encrypt sensitive data
- ✅ Regular backups
- ❌ Never expose MongoDB directly to internet

### Monitoring
- ✅ Monitor slow queries
- ✅ Track database size
- ✅ Monitor connection pool
- ✅ Set up alerts for issues

---

## Database Maintenance

### Regular Tasks

```bash
# Compact database
db.runCommand({ compact: 'users' })

# Rebuild indexes
db.products.reIndex()

# Check database stats
db.stats()

# Check collection stats
db.users.stats()
```

---

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Schema Design Patterns](https://www.mongodb.com/blog/post/building-with-patterns-a-summary)

---

**Need help with database?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or open an issue on GitHub.
