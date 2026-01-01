# ShopSphere FAQ (Frequently Asked Questions)

Common questions and answers about ShopSphere.

## Table of Contents

- [General Questions](#general-questions)
- [Setup and Installation](#setup-and-installation)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Features and Functionality](#features-and-functionality)
- [Security](#security)
- [Performance](#performance)

---

## General Questions

### What is ShopSphere?

ShopSphere is a modern, scalable e-commerce platform built with a microservices architecture using Node.js, Express, and MongoDB. It provides features like user authentication, product catalog management, order processing, and notifications.

### What technologies does ShopSphere use?

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Caching/Queue**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker, Docker Compose
- **Email**: Brevo (formerly Sendinblue)

### Is ShopSphere production-ready?

ShopSphere is currently in active development. Core features are implemented, but it's recommended to review the [Implementation Status](../IMPLEMENTATION_STATUS.md) before deploying to production.

### What license is ShopSphere released under?

ShopSphere is released under the MIT License, which allows for commercial and non-commercial use with attribution.

---

## Setup and Installation

### What are the system requirements?

**Minimum Requirements:**
- 4GB RAM
- 2 CPU cores
- 20GB disk space
- Docker 20.10+ and Docker Compose 1.29+

**Recommended:**
- 8GB RAM
- 4 CPU cores
- 50GB disk space

### How do I install ShopSphere locally?

```bash
# Clone repository
git clone https://github.com/oyugijr/shop_sphere.git
cd shop_sphere

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start with Docker
docker-compose up -d
```

See the [Setup Guide](./docs/SETUP.md) for detailed instructions.

### Do I need MongoDB Atlas or can I use local MongoDB?

You can use either:
- **Local MongoDB**: Included in the Docker Compose setup (recommended for development)
- **MongoDB Atlas**: Recommended for production deployments

### Why is the application not starting?

Common causes:
1. **Port conflicts**: Make sure ports 3000, 5001-5004, 27017, 6379, 8081 are available
2. **Environment variables**: Check that `.env` file is properly configured
3. **Docker not running**: Ensure Docker daemon is running
4. **Insufficient resources**: Docker needs at least 4GB RAM allocated

See the [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) for more solutions.

---

## Development

### How do I run tests?

```bash
# Navigate to a service
cd user-service

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

See the [Testing Guide](./docs/TESTING.md) for comprehensive testing information.

### How do I add a new API endpoint?

1. Create/update route file in `src/routes/`
2. Create controller function in `src/controllers/`
3. Add business logic in `src/services/`
4. Update API documentation in `docs/API.md`

Example:
```javascript
// src/routes/userRoutes.js
router.get('/users/:id', authMiddleware, getUserProfile);

// src/controllers/userController.js
const getUserProfile = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, data: user });
};
```

### How do I add a new microservice?

1. Create service directory following the standard structure
2. Add Dockerfile
3. Update `docker-compose.yml`
4. Add routing in API Gateway
5. Update documentation

See the [Contributing Guide](../CONTRIBUTING.md) for detailed steps.

### Can I use TypeScript instead of JavaScript?

Yes! The project structure supports TypeScript. You would need to:
1. Install TypeScript dependencies
2. Add `tsconfig.json`
3. Convert files from `.js` to `.ts`
4. Update build scripts

### How do I debug the application?

**Using VS Code:**
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "remoteRoot": "/app",
  "port": 9229
}
```

**Enable debug mode:**
```bash
# In docker-compose.yml, add:
command: node --inspect=0.0.0.0:9229 app.js
ports:
  - "9229:9229"
```

---

## Deployment

### How do I deploy to production?

See the comprehensive [Deployment Guide](./docs/DEPLOYMENT.md). Basic steps:

1. Configure production environment variables
2. Set up MongoDB Atlas or managed MongoDB
3. Configure Redis for production
4. Set up SSL/TLS certificates
5. Deploy using Docker, Kubernetes, or cloud services
6. Set up monitoring and backups

### What cloud providers are supported?

ShopSphere can be deployed on any cloud provider:
- **AWS**: ECS, EKS, EC2
- **Google Cloud**: GKE, Compute Engine
- **Azure**: AKS, Container Instances
- **DigitalOcean**: Droplets, Kubernetes
- **Heroku**: Container deployment

### How do I configure HTTPS?

**Option 1: Using Nginx reverse proxy**
```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

**Option 2: Using a load balancer** (AWS ALB, Google Cloud Load Balancer, etc.)

### How do I scale the application?

**Horizontal Scaling:**
```bash
# Docker Swarm
docker service scale shopsphere_user-service=3

# Kubernetes
kubectl scale deployment user-service --replicas=3
```

See [Deployment Guide - Scaling](./docs/DEPLOYMENT.md#scaling-strategies) for more details.

---

## Troubleshooting

### Service keeps restarting

Check logs:
```bash
docker-compose logs user-service
```

Common causes:
1. Database connection failed
2. Missing environment variables
3. Port already in use
4. Application crash on startup

### Database connection timeout

Solutions:
1. Check MongoDB is running: `docker ps | grep mongodb`
2. Verify connection string in `.env`
3. Check network connectivity: `docker exec user-service ping mongodb`
4. Increase connection timeout in Mongoose config

### "ECONNREFUSED" errors between services

This usually means services can't communicate. Solutions:
1. Ensure all services are on the same Docker network
2. Use service names (not localhost) in URLs
3. Verify services are running: `docker-compose ps`

### High memory usage

Solutions:
1. Check for memory leaks in code
2. Implement caching strategically
3. Use pagination for large datasets
4. Close database connections properly
5. Scale horizontally instead of vertically

See the [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) for more issues and solutions.

---

## Features and Functionality

### Does ShopSphere support payment processing?

Not yet. Payment integration (Stripe, PayPal) is planned. See the [Roadmap](../ROADMAP.md) for upcoming features.

### Can I customize the database schema?

Yes! You can modify the Mongoose models in each service's `src/models/` directory. Remember to:
1. Update migrations if changing existing fields
2. Update API documentation
3. Run tests after changes

### How do I send custom email notifications?

```javascript
const notificationService = require('./services/notificationService');

await notificationService.sendNotification({
  userId: user.id,
  type: 'email',
  subject: 'Custom Email',
  message: 'Your custom message',
  template: 'custom-template'
});
```

### Does it support multi-language?

Not currently, but you can implement i18n:
```bash
npm install i18n
```

### Can I use a different database?

MongoDB is deeply integrated, but you could replace it with:
- PostgreSQL (with Sequelize ORM)
- MySQL (with Sequelize ORM)
- Other NoSQL databases

This would require significant refactoring.

---

## Security

### How are passwords stored?

Passwords are hashed using bcryptjs with 10 salt rounds before storing in the database. Passwords are never stored in plain text.

### How does authentication work?

ShopSphere uses JWT (JSON Web Tokens):
1. User logs in with credentials
2. Server validates and returns JWT
3. Client includes JWT in Authorization header
4. Server validates JWT on each request

### How do I secure the API in production?

1. Use HTTPS everywhere
2. Set strong JWT secret
3. Configure CORS properly
4. Enable rate limiting
5. Keep dependencies updated
6. Use environment variables for secrets
7. Implement API key authentication for service-to-service calls

See the [Security Best Practices](./docs/SECURITY.md) guide.

### Are there any known security vulnerabilities?

Run security audits regularly:
```bash
npm audit
docker scan shopsphere-user-service:latest
```

Report security issues to the maintainers.

---

## Performance

### How many requests can ShopSphere handle?

Performance depends on:
- Hardware resources
- Database optimization
- Caching strategy
- Number of service replicas

Typical performance with default setup:
- ~100 requests/second per service instance
- Can scale horizontally for higher throughput

### How do I improve API response times?

1. **Enable caching**: Use Redis for frequently accessed data
2. **Optimize queries**: Add indexes, use projections
3. **Use CDN**: For static assets
4. **Implement pagination**: Limit data returned
5. **Use lean queries**: Return plain objects instead of Mongoose documents

### Should I use clustering?

Yes, for production:
```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Start server
  app.listen(PORT);
}
```

Or use Docker Swarm/Kubernetes for orchestration.

---

## Contributing

### How can I contribute?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

See the [Contributing Guide](../CONTRIBUTING.md) for detailed instructions.

### Where should I report bugs?

Open an issue on GitHub with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Logs/screenshots

### How do I suggest new features?

Open a feature request issue on GitHub explaining:
- Use case and benefits
- Proposed implementation
- Any examples from other projects

---

## Additional Questions

### Where can I find the API documentation?

See [API Documentation](./docs/API.md) for all endpoints, request/response formats, and examples.

### Is there a demo or live version?

Check the repository README for links to any demo deployments.

### How do I get support?

1. Check this FAQ
2. Review documentation
3. Search existing GitHub issues
4. Open a new issue with details
5. Join community discussions (if available)

### Can I use ShopSphere for my business?

Yes! ShopSphere is released under the MIT License, which permits commercial use. However, review the implementation status and test thoroughly before production use.

---

## Still Have Questions?

- 📚 [Read the Documentation](./docs/)
- 💬 [Open a GitHub Discussion](https://github.com/oyugijr/shop_sphere/discussions)
- 🐛 [Report an Issue](https://github.com/oyugijr/shop_sphere/issues)
- 📧 Contact the maintainers

---

**Last Updated**: January 2026
