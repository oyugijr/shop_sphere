# ShopSphere 🛍️

A modern, scalable microservices-based e-commerce platform built with Node.js, Express, and MongoDB.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Security: CodeQL](https://img.shields.io/badge/Security-CodeQL%20Verified-brightgreen.svg)](https://github.com/oyugijr/shop_sphere/security)

## 📊 Project Status

| Component | Status | Coverage |
|-----------|--------|----------|
| Core Services | ✅ Implemented | 60% |
| Infrastructure | ✅ Implemented | 75% |
| Testing | ⚠️ Partial | 5% |
| CI/CD | ❌ Not Started | 0% |
| Documentation | ✅ Complete | 100% |
| **Overall** | 🔨 **In Development** | **~40%** |

> 📋 **See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for detailed analysis**

## 🚀 Features

- **Microservices Architecture**: Independently deployable and scalable services
- **RESTful APIs**: Clean and well-documented API endpoints
- **JWT Authentication**: Secure user authentication and authorization
- **Role-Based Access Control**: Admin and user roles with appropriate permissions
- **Health Checks**: Monitor service availability and health
- **Rate Limiting**: Protection against API abuse
- **Docker Support**: Easy deployment with Docker Compose
- **MongoDB Database**: Flexible NoSQL database for all services
- **Notification System**: Email notifications with queue-based processing

## 📋 Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | Entry point for all client requests, handles routing and rate limiting |
| **User Service** | 5001 | User authentication, registration, and profile management |
| **Product Service** | 5002 | Product catalog and inventory management |
| **Order Service** | 5003 | Order creation, tracking, and management |
| **Notification Service** | 5004 | Email and push notifications with queue-based processing |
| **MongoDB** | 27017 | Database for all services |
| **Redis** | 6379 | Message queue and caching for notification service |
| **MongoDB Express** | 8081 | Web-based MongoDB admin interface |

## 🏗️ Architecture

```sh
Client → API Gateway → [User/Product/Order Services] → MongoDB
                    ↓
              Notification Service → Redis Queue → Email/SMS/WhatsApp
```

For detailed architecture information, see [Architecture Documentation](./docs/ARCHITECTURE.md).

## 🚦 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (1.29+)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/oyugijr/shop_sphere.git
   cd shop_sphere
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration (especially MongoDB URI and JWT secret).

3. **Start all services**

   ```bash
   docker-compose up -d
   ```

4. **Verify services are running**

   ```bash
   curl http://localhost:3000/health
   ```

5. **Access the application**
   - API Gateway: <http://localhost:3000>
   - MongoDB Admin UI: <http://localhost:8081>

### Stop Services

```bash
docker-compose down
```

To remove all data:

```bash
docker-compose down -v
```

## 📚 Documentation

### Getting Started

- **[Quick Reference](./QUICK_REFERENCE.md)** - Fast setup and common tasks
- **[Setup Guide](./docs/SETUP.md)** - Detailed installation and configuration

### Technical Documentation

- **[API Documentation](./docs/API.md)** - Complete API reference
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and data flow

### Project Status & Planning

- **[Implementation Status](./IMPLEMENTATION_STATUS.md)** - What's implemented, partially done, and missing
- **[Development Roadmap](./ROADMAP.md)** - Prioritized implementation plan
- **[Review Summary](./REVIEW_SUMMARY.md)** - Latest project review findings

### Contributing

- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[Enhancement History](./ENHANCEMENTS.md)** - Previous improvements log

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting (100 requests/minute)
- CORS configuration
- Environment-based secrets management
- Role-based access control

## 🧪 Testing

Run tests for individual services:

```bash
# User Service
cd user-service && npm test

# Product Service
cd product-service && npm test

# Order Service
cd order-service && npm test
```

## 🛠️ Development

### Local Development Setup

1. Install dependencies for each service:

   ```bash
   cd api-gateway && npm install
   cd ../user-service && npm install
   cd ../product-service && npm install
   cd ../order-service && npm install
   cd ../notification-service && npm install
   ```

2. Start MongoDB:

   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. Run services individually:

   ```bash
   cd user-service && node app.js
   ```

For more details, see the [Setup Guide](./docs/SETUP.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 API Examples

### User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"securepass123"}'
```

### Create Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Laptop","description":"Gaming laptop","price":999.99,"category":"electronics","stock":10}'
```

### Create Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"items":[{"productId":"PRODUCT_ID","quantity":1,"price":999.99}]}'
```

## 🔮 Future Enhancements

- [ ] Payment service integration (Stripe/PayPal)
- [ ] Advanced search with Elasticsearch
- [ ] Product reviews and ratings
- [ ] Shopping cart service
- [ ] Real-time inventory updates
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline
- [ ] Monitoring with Prometheus/Grafana
- [ ] API documentation with Swagger/OpenAPI

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Oyugi Mourice** - GitHub: [@oyugijr](https://github.com/oyugijr)

## 🙏 Acknowledgments

- Built with Node.js and Express
- MongoDB for data persistence
- Docker for containerization
- All contributors and supporters

---
