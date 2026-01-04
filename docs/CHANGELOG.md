# ShopSphere Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features

- Payment service integration (Stripe, PayPal)
- Shopping cart service
- Product reviews and ratings
- Advanced search with Elasticsearch
- Real-time inventory updates
- CI/CD pipeline
- Kubernetes deployment manifests
- API documentation with Swagger/OpenAPI

---

## [0.3.0] - 2024-12-17

### Added

- **Notification Service** improvements
  - Redis queue integration for asynchronous processing
  - Notification worker for background processing
  - Brevo API integration for email, SMS, and WhatsApp
  - Notification history and tracking
- **Documentation** enhancements
  - Implementation status document
  - Quick reference guide
  - Enhanced roadmap with prioritized tasks
  - Review summary document
- **Environment Configuration**
  - Redis configuration variables
  - Brevo API key configuration
  - Comprehensive `.env.example` file

### Changed

- Updated docker-compose.yml to include Redis service
- Enhanced notification service architecture with queue-based processing

### Fixed

- Notification service queue configuration
- Redis connection handling
- Environment variable consistency across services

---

## [0.2.0] - 2024-12-01

### Added (Order Service & Security)

- **Order Service**
  - Order creation and management
  - Order status tracking (pending, processing, shipped, delivered, cancelled)
  - Order history for users
  - Admin-only order status updates
- **Enhanced Security**
  - Role-based access control (RBAC)
  - Admin and user roles implementation
  - Protected admin routes
- **API Gateway Improvements**
  - Order service routing
  - Enhanced error handling
  - Request/response logging

### Changed (Order Service & Documentation)

- Order model with comprehensive shipping address structure
- Updated API documentation with order endpoints

---

## [0.1.0] - 2024-11-15

### Added (Core Services & Infrastructure)

- **Core Microservices Architecture**
  - API Gateway service (port 3000)
  - User Service (port 5001)
  - Product Service (port 5002)
  - Order Service (port 5003)
  - Notification Service (port 5004)

- **User Service**
  - User registration with email validation
  - User login with JWT authentication
  - Password hashing with bcryptjs
  - User profile management
  - Role-based access control

- **Product Service**
  - Product CRUD operations
  - Product catalog with pagination
  - Category-based filtering
  - Search functionality
  - Inventory management

- **API Gateway**
  - HTTP proxy middleware for routing
  - Rate limiting (100 requests/minute)
  - CORS configuration
  - Security headers middleware
  - Health check endpoints

- **Security Features**
  - JWT-based authentication
  - Password hashing
  - Rate limiting
  - CORS protection
  - Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

- **Database**
  - MongoDB integration
  - Mongoose ODM
  - Database connection configuration
  - User, Product, Order, and Notification models

- **Docker Support**
  - Dockerfiles for all services
  - Docker Compose configuration
  - MongoDB container
  - MongoDB Express admin UI (port 8081)
  - Network configuration

- **Documentation**
  - README with setup instructions
  - API documentation
  - Architecture documentation
  - Setup guide
  - Contributing guidelines

### Changed (Core Services & Infrastructure)

- N/A (initial release)

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- Implemented JWT authentication
- Added password hashing
- Configured CORS
- Added rate limiting

---

## [0.0.1] - 2024-11-01

### Added

- Initial project setup
- Basic project structure
- Git repository initialization
- License file (MIT)
- Basic README

---

## Version Numbering

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards compatible manner
- **PATCH** version when making backwards compatible bug fixes

## Categories

Changes are categorized as:

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements

---

## Contributing to Changelog

When contributing, please update this changelog with your changes:

1. Add your changes under the `[Unreleased]` section
2. Use the appropriate category
3. Provide a clear description
4. Reference issue numbers when applicable

Example:

```markdown
### Added
- New feature description (#123)

### Fixed
- Bug fix description (#124)
```

---

## Links

- [Repository](https://github.com/oyugijr/shop_sphere)
- [Issues](https://github.com/oyugijr/shop_sphere/issues)
- [Pull Requests](https://github.com/oyugijr/shop_sphere/pulls)
- [Releases](https://github.com/oyugijr/shop_sphere/releases)

---

**Maintained by**: [@oyugijr](https://github.com/oyugijr)
