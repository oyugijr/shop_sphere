# Product Service - Production Ready

A production-ready microservice for managing products in the ShopSphere e-commerce platform.

## Features

### Core Functionality
- ✅ Complete CRUD operations for products
- ✅ Advanced search and filtering
- ✅ Pagination and sorting
- ✅ Stock management (increase, decrease, check availability)
- ✅ Bulk operations
- ✅ Product statistics and analytics
- ✅ Soft delete support

### Production Features
- ✅ Comprehensive input validation and sanitization
- ✅ Rate limiting (strict for writes, lenient for reads)
- ✅ Structured logging
- ✅ Custom error handling
- ✅ Database indexes for performance
- ✅ Health checks (basic, liveness, readiness)
- ✅ Graceful shutdown
- ✅ Database connection retry logic
- ✅ CORS configuration
- ✅ Security headers
- ✅ Request size limits

### Security
- ✅ JWT authentication
- ✅ XSS protection (input sanitization)
- ✅ SQL injection prevention
- ✅ Rate limiting
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Input validation
- ✅ Environment variable validation

## API Endpoints

### Public Endpoints (Read)

#### Get All Products
```http
GET /api/products?page=1&limit=10&sortBy=createdAt&sortOrder=desc&category=electronics&active=true
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): Sort field (default: 'createdAt')
- `sortOrder` (optional): 'asc' or 'desc' (default: 'desc')
- `category` (optional): Filter by category
- `active` (optional): Filter active products only
- `search` (optional): Text search

#### Get Product by ID
```http
GET /api/products/:id
```

#### Search Products
```http
GET /api/products/search?q=laptop&page=1&limit=10
```

#### Get Products by Category
```http
GET /api/products/category/:category?page=1&limit=10
```

#### Check Stock Availability
```http
GET /api/products/:id/stock/check?quantity=5
```

#### Get Product Statistics
```http
GET /api/products/stats
```

Response:
```json
{
  "totalProducts": 150,
  "activeProducts": 145,
  "totalStock": 5000,
  "averagePrice": 299.99,
  "minPrice": 9.99,
  "maxPrice": 2999.99
}
```

#### Get Category Statistics
```http
GET /api/products/stats/categories
```

### Protected Endpoints (Write - Requires Authentication)

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop with RTX 4080",
  "price": 1999.99,
  "stock": 10,
  "category": "electronics",
  "brand": "ASUS",
  "sku": "ASUS-ROG-001",
  "tags": ["gaming", "laptop", "high-performance"]
}
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 1899.99,
  "stock": 15
}
```

#### Delete Product (Soft Delete)
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

#### Bulk Create Products
```http
POST /api/products/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [
    {
      "name": "Product 1",
      "description": "Description 1",
      "price": 99.99,
      "stock": 10,
      "category": "electronics"
    },
    {
      "name": "Product 2",
      "description": "Description 2",
      "price": 199.99,
      "stock": 5,
      "category": "electronics"
    }
  ]
}
```

### Stock Management Endpoints

#### Update Stock (Set)
```http
PATCH /api/products/:id/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 25
}
```

#### Increase Stock
```http
POST /api/products/:id/stock/increase
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 10
}
```

#### Decrease Stock
```http
POST /api/products/:id/stock/decrease
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 5
}
```

## Product Model

### Required Fields
- `name` (String, 2-200 chars): Product name
- `description` (String, 10-2000 chars): Product description
- `price` (Number, >= 0): Product price
- `stock` (Number, >= 0, integer): Stock quantity
- `category` (String): Product category (lowercase)

### Optional Fields
- `imageUrl` (String): Product image URL
- `sku` (String): Stock Keeping Unit (auto-generated if not provided)
- `brand` (String): Product brand
- `tags` (Array of Strings): Product tags
- `rating` (Number, 0-5): Average rating
- `reviewCount` (Number): Number of reviews
- `isActive` (Boolean): Product availability status
- `dimensions` (Object): Product dimensions (length, width, height, weight)

### Auto-Generated Fields
- `_id`: MongoDB ObjectId
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `isDeleted`: Soft delete flag
- `sku`: Auto-generated if not provided

### Virtual Fields
- `isAvailable`: Computed based on `isActive`, `isDeleted`, and `stock > 0`

## Environment Variables

Required:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT validation
- `PORT`: Service port (default: 5002)

Optional:
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: CORS allowed origin (default: *)

## Rate Limiting

- **Read endpoints**: 100 requests per minute per user/IP
- **Write endpoints**: 30 requests per minute per authenticated user

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time
- `Retry-After`: Seconds to wait (when rate limited)

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "timestamp": "2024-12-23T14:00:00.000Z",
  "statusCode": 400,
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found
- `409`: Conflict (duplicate SKU)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Health Checks

### Basic Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "product-service",
  "timestamp": "2024-12-23T14:00:00.000Z",
  "uptime": 3600.5,
  "database": {
    "status": "connected",
    "connected": true
  },
  "memory": {
    "usage": "45 MB",
    "total": "128 MB"
  },
  "environment": "production"
}
```

### Liveness Probe
```http
GET /liveness
```

### Readiness Probe
```http
GET /readiness
```

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the service
npm start

# Development mode with auto-reload
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Docker Support

```bash
# Build image
docker build -t product-service .

# Run container
docker run -p 5002:5002 \
  -e MONGO_URI=mongodb://mongo:27017/shopSphere \
  -e JWT_SECRET=your_secret \
  product-service
```

## Performance

### Database Indexes
- Text index on: name, description, tags
- Compound index on: category, price
- Compound index on: isActive, isDeleted
- Unique sparse index on: sku
- Index on: createdAt (descending)

### Optimization Tips
- Use pagination for large result sets
- Use filtering and sorting to reduce data transfer
- Leverage text search for efficient queries
- Monitor rate limits to avoid throttling
- Use bulk operations for multiple products

## Logging

All logs are structured JSON with the following format:
```json
{
  "timestamp": "2024-12-23T14:00:00.000Z",
  "level": "INFO|WARN|ERROR|DEBUG",
  "message": "Log message",
  "service": "product-service",
  "metadata": {}
}
```

## Monitoring

### Key Metrics to Monitor
- Response times
- Error rates
- Database connection status
- Memory usage
- Rate limit hits
- Request volume

### Recommended Tools
- Prometheus for metrics
- Grafana for visualization
- ELK Stack for log aggregation
- APM tools (New Relic, Datadog)

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use HTTPS** in production
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Validate all inputs** - Already implemented
5. **Use rate limiting** - Already implemented
6. **Monitor logs** for suspicious activity
7. **Use strong JWT secrets** - Change default secret
8. **Enable MongoDB authentication** in production

## Contributing

1. Follow existing code structure
2. Write tests for new features
3. Update documentation
4. Follow error handling patterns
5. Use structured logging
6. Validate all inputs

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
