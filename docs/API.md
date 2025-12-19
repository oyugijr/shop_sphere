# ShopSphere API Documentation

## Base URLs

- **API Gateway**: `http://localhost:3000`
- **User Service**: `http://localhost:5001`
- **Product Service**: `http://localhost:5002`
- **Order Service**: `http://localhost:5003`
- **Notification Service**: `http://localhost:5004`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```sh
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Health Checks

#### Check API Gateway Health

- **GET** `/health`
- **Response**:

  ```json
  {
    "status": "healthy",
    "service": "api-gateway"
  }
  ```

### User Service

#### Register User

- **POST** `/api/auth/register`
- **Body**:

  ```json
  {
    "name": "John Doe",
    "email": "oyugi@example.com",
    "password": "securepassword"
  }
  ```

- **Response**: User object with JWT token

#### Login

- **POST** `/api/auth/login`
- **Body**:

  ```json
  {
    "email": "oyugi@example.com",
    "password": "securepassword"
  }
  ```

- **Response**: User object with JWT token

#### Get User Profile

- **GET** `/api/users/:id`
- **Auth**: Required
- **Response**: User profile data

#### Update User Profile

- **PUT** `/api/users/:id`
- **Auth**: Required
- **Body**: Updated user fields
- **Response**: Updated user object

### Product Service

#### Get All Products

- **GET** `/api/products`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `category`: Filter by category
- **Response**: Array of product objects

#### Get Single Product

- **GET** `/api/products/:id`
- **Response**: Product object

#### Create Product

- **POST** `/api/products`
- **Auth**: Required
- **Body**:

  ```json
  {
    "name": "Product Name",
    "description": "Product description",
    "price": 29.99,
    "category": "electronics",
    "stock": 100,
    "imageUrl": "https://example.com/image.jpg"
  }
  ```

- **Response**: Created product object

#### Update Product

- **PUT** `/api/products/:id`
- **Auth**: Required
- **Body**: Fields to update
- **Response**: Updated product object

#### Delete Product

- **DELETE** `/api/products/:id`
- **Auth**: Required
- **Response**: Success message

### Order Service

#### Create Order

- **POST** `/api/orders`
- **Auth**: Required
- **Body**:

  ```json
  {
    "items": [
      {
        "productId": "product_id_here",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "zipCode": "12345",
      "country": "Country"
    }
  }
  ```

- **Response**: Created order object

#### Get Order by ID

- **GET** `/api/orders/:id`
- **Auth**: Required
- **Response**: Order object

#### Get User Orders

- **GET** `/api/orders`
- **Auth**: Required
- **Query Parameters**:
  - `status`: Filter by order status
  - `page`: Page number
  - `limit`: Items per page
- **Response**: Array of order objects

#### Update Order Status

- **PUT** `/api/orders/:id/status`
- **Auth**: Required (Admin only)
- **Body**:

  ```json
  {
    "status": "shipped"
  }
  ```

- **Response**: Updated order object

### Notification Service

#### Send Notification

- **POST** `/api/notifications/send`
- **Auth**: Required
- **Body**:

  ```json
  {
    "userId": "user_id_here",
    "type": "email",
    "subject": "Order Confirmation",
    "message": "Your order has been confirmed"
  }
  ```

- **Response**: Notification sent confirmation

#### Get User Notifications

- **GET** `/api/notifications/:userId`
- **Auth**: Required
- **Response**: Array of notification objects

#### Mark Notification as Read

- **PATCH** `/api/notifications/:id/read`
- **Auth**: Required
- **Response**: Updated notification object

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

The API Gateway implements rate limiting:

- **Limit**: 100 requests per minute per IP address
- **Response when exceeded**: 429 Too Many Requests

## CORS

CORS is enabled for all origins by default. In production, configure the `ALLOWED_ORIGINS` environment variable.
