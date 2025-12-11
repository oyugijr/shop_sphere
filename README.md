# ShopSphere

This project is a microservices-based online store system, designed for scalability and ease of maintenance.

## ⚠️ IMPORTANT: Project Status

**Current Status**: 🟡 Alpha Development - Has Critical Bugs

This project is **not production-ready** and has several critical bugs that prevent it from running. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for details.

## 📚 Documentation

Before starting, please read these documents:

- **[SUMMARY.md](SUMMARY.md)** - Start here! Navigation guide to all documentation
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current project state and critical issues
- **[TODO.md](TODO.md)** - Complete task list (100+ items) with priorities
- **[QUICKSTART.md](QUICKSTART.md)** - Setup guide and API examples
- **[ROADMAP.md](ROADMAP.md)** - 12-week development plan

### Quick Links

| I want to... | Read this |
|-------------|-----------|
| Understand the project | [PROJECT_STATUS.md](PROJECT_STATUS.md) |
| Set up my environment | [QUICKSTART.md](QUICKSTART.md) |
| Know what to work on | [TODO.md](TODO.md) |
| See the timeline | [ROADMAP.md](ROADMAP.md) |
| Navigate all docs | [SUMMARY.md](SUMMARY.md) |

## 🏗️ Architecture Overview

- **`docker-compose.yml`**: Orchestrates all services within the project
- **`api-gateway/`**: Entry point for all requests (Port 3000) - ❌ Has bugs
- **`user-service/`**: User authentication and management (Port 5001) - ⚠️ Docker config issue
- **`product-service/`**: Product catalog and inventory (Port 5002) - ❌ Has bugs
- **`order-service/`**: Order processing and management (Port 5003) - ❌ Has bugs
- **`notification-service/`**: Email/push notifications (Port 5004) - ❌ Missing from docker-compose
- **`payment-service/`**: Payment processing ❌ **NOT IMPLEMENTED**
- **`shared-libs/`**: Shared utilities and DTOs ❌ **NOT IMPLEMENTED**
- **`infra/`**: Infrastructure scripts ❌ **NOT IMPLEMENTED**
- **`docs/`**: API documentation ❌ **NOT IMPLEMENTED**

## 🚨 Critical Issues (Must Fix First)

1. **API Gateway**: `orderRoute` variable not defined
2. **Product Service**: Wrong controller import path
3. **Order Service**: Database connection broken
4. **Port Conflict**: notification-service conflicts with order-service
5. **Docker**: notification-service not in docker-compose.yml

See [TODO.md](TODO.md) for complete list and fix instructions.

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### ⚠️ Warning: Won't Work Yet!

The application **cannot run** due to critical bugs. To fix:

1. Read [TODO.md](TODO.md) - Section "Critical Bugs"
2. Fix all P0 issues first
3. Then follow setup below

### Setup (After Bugs Fixed)

```bash
# Clone repository
git clone https://github.com/oyugijr/shop_sphere.git
cd shop_sphere

# Configure environment variables (see QUICKSTART.md)
# Create .env files for each service

# Start all services
docker-compose up --build
```

For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md).

## 📊 Project Statistics

- **Services**: 5 of 6 implemented (83%)
- **Working**: 0% (critical bugs present)
- **Test Coverage**: <10%
- **Production Ready**: ❌ No

## 🎯 Development Roadmap

**Target Timeline**: 12 weeks to production-ready

- **Week 1-2**: Fix critical bugs & stabilize
- **Week 3-4**: Implement missing features (payment service)
- **Week 5-6**: Testing & quality improvements
- **Week 7-8**: DevOps & monitoring
- **Week 9-10**: Advanced features
- **Week 11-12**: Optimization & launch prep

See [ROADMAP.md](ROADMAP.md) for detailed sprint planning.

## 🤝 Contributing

1. Read [SUMMARY.md](SUMMARY.md) to understand the project
2. Check [TODO.md](TODO.md) for tasks
3. Start with P0 critical bugs
4. Follow [QUICKSTART.md](QUICKSTART.md) for setup
5. Submit pull requests

## 📝 What's Working vs What's Not

### ✅ Implemented (but may have bugs)
- User registration and authentication
- Product CRUD operations
- Order management
- Notification system
- Docker containerization

### ❌ Critical Issues
- Multiple services won't start
- Port conflicts
- Missing service configurations
- Security vulnerabilities (exposed credentials)

### ❌ Not Implemented
- Payment service
- Shared libraries
- Infrastructure automation
- API documentation
- Testing infrastructure

## 📖 Technology Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcryptjs
- **Queue**: Bull + Redis
- **Email**: Nodemailer
- **Containers**: Docker + Docker Compose
- **Testing**: Jest + Supertest (not configured)

## 📞 Support

For questions or issues:

1. Check [SUMMARY.md](SUMMARY.md) for documentation navigation
2. Read [QUICKSTART.md](QUICKSTART.md) troubleshooting section
3. Review [PROJECT_STATUS.md](PROJECT_STATUS.md) for known issues
4. Check [TODO.md](TODO.md) to see if issue is documented

## 📜 License

This project is licensed under the ISC License.

---

**Last Updated**: 2025-12-11  
**Version**: 0.1.0-alpha  
**Status**: 🔴 Not Production Ready - Critical bugs present 
