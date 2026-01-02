# Product Service

The Product Service manages the product catalog, inventory, and product-related operations for ShopSphere.

## Overview

The Product Service provides:

- **Product Catalog Management**: Create, read, update, and delete products
- **Inventory Tracking**: Monitor product stock levels
- **Category Management**: Organize products by categories
- **Search and Filtering**: Find products by various criteria
- **Product Pagination**: Efficient browsing of large catalogs

## Port

- **Default**: 5002
- **Configure via**: `PRODUCT_SERVICE_PORT` environment variable

## API Endpoints

### Get All Products

```http
GET /api/products?page=1&limit=20&category=electronics
```

### Get Single Product

```http
GET /api/products/:id
```

### Create Product (Auth Required)

```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 1299.99,
  "category": "electronics",
  "stock": 50,
  "imageUrl": "https://example.com/image.jpg"
}
```

### Update Product (Auth Required)

```http
PUT /api/products/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 1199.99,
  "stock": 45
}
```

### Delete Product (Auth Required)

```http
DELETE /api/products/:id
Authorization: Bearer {token}
```

## Database Schema

### Product Model

```javascript
{
  name: String,              // Required, max 200 chars
  slug: String,              // Auto-generated, unique
  description: String,       // Required, max 2000 chars
  price: Number,             // Required, min 0
  category: String,          // Required, enum
  stock: Number,             // Required, min 0, default 0
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean
  }],
  rating: {
    average: Number,         // 0-5, default 0
    count: Number            // Default 0
  },
  isActive: Boolean,         // Default true
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Categories

- electronics
- clothing
- books
- home
- sports
- other

### Indexes

- Text index on `name` and `description` for search
- Compound index on `category` and `price`
- Index on `rating.average` for sorting
- Unique index on `slug`

## Configuration

```env
PORT=5002
MONGO_URI=mongodb://mongodb:27017/shopSphere
JWT_SECRET=your_jwt_secret
```

## Project Structure

```sh
product-service/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── productController.js
│   ├── models/
│   │   └── Product.js
│   ├── routes/
│   │   └── productRoutes.js
│   ├── services/
│   │   └── productService.js
│   ├── repositories/
│   │   └── productRepository.js
│   └── utils/
│       └── validation.js
├── tests/
├── app.js
├── Dockerfile
└── package.json
```

## Features

### Search

Full-text search on product name and description:

```http
GET /api/products?search=gaming
```

### Filtering

Filter by category:

```http
GET /api/products?category=electronics
```

Filter by price range:

```http
GET /api/products?minPrice=100&maxPrice=1000
```

### Sorting

Sort by different fields:

```http
GET /api/products?sortBy=price&order=asc
GET /api/products?sortBy=rating&order=desc
```

### Pagination

```http
GET /api/products?page=2&limit=20
```

## Running Locally

```bash
# With Docker
docker-compose up product-service

# Standalone
cd product-service
npm install
npm start
```

## Testing

```bash
npm test
npm run test:coverage
```

## Troubleshooting

### Products Not Returning

- Check database connection
- Verify MongoDB has product data
- Check filters/query parameters

### Stock Not Updating

- Ensure proper authorization
- Check for concurrent update conflicts
- Verify stock validation rules

## Contributing

See [Contributing Guide](../CONTRIBUTING.md)

## Related Documentation

- [API Documentation](../docs/API.md)
- [Database Guide](../docs/DATABASE.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)

---

**Maintained by**: ShopSphere Team
