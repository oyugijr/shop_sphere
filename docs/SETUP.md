# ShopSphere Setup Guide

## Prerequisites

- [Docker](https://www.docker.com/get-started) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 1.29 or higher)
- [Node.js](https://nodejs.org/) (version 16 or higher) - for local development
- [MongoDB](https://www.mongodb.com/) (if running services individually)

## Quick Start with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/oyugijr/shop_sphere.git
cd shop_sphere
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# For local development with Docker
MONGO_URI=mongodb://mongodb:27017/shopSphere

# For production with MongoDB Atlas
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopSphere

JWT_SECRET=your_secure_jwt_secret_here
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- API Gateway (port 3000)
- User Service (port 5001)
- Product Service (port 5002)
- Order Service (port 5003)
- Notification Service (port 5004)
- MongoDB (port 27017)
- MongoDB Express (port 8081)

### 4. Verify Services are Running

Check service health:

```bash
curl http://localhost:3000/health
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
curl http://localhost:5004/health
```

### 5. Access MongoDB Admin UI

Open MongoDB Express in your browser:
```
http://localhost:8081
```

### 6. Stop Services

```bash
docker-compose down
```

To remove volumes (delete database data):
```bash
docker-compose down -v
```

## Local Development Setup

If you want to run services individually for development:

### 1. Install Dependencies

For each service, navigate to its directory and install dependencies:

```bash
# API Gateway
cd api-gateway
npm install

# User Service
cd ../user-service
npm install

# Product Service
cd ../product-service
npm install

# Order Service
cd ../order-service
npm install

# Notification Service
cd ../notification-service
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in each service directory with appropriate configuration:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/shopSphere
JWT_SECRET=your_jwt_secret
```

### 3. Start MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run Services

In separate terminal windows:

```bash
# API Gateway
cd api-gateway && node app.js

# User Service
cd user-service && node app.js

# Product Service
cd product-service && node app.js

# Order Service
cd order-service && node app.js

# Notification Service
cd notification-service && node app.js
```

## Development with Hot Reload

Install nodemon globally or use it as a dev dependency:

```bash
npm install -g nodemon
```

Then run services with:

```bash
nodemon app.js
```

## Testing

Run tests for each service:

```bash
# User Service
cd user-service
npm test

# Product Service
cd product-service
npm test

# Order Service
cd order-service
npm test

# Notification Service
cd notification-service
npm test
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find the process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### MongoDB Connection Issues

1. Check if MongoDB is running:
   ```bash
   docker ps | grep mongodb
   ```

2. Check MongoDB logs:
   ```bash
   docker logs shopsphere-mongo
   ```

3. Verify connection string in `.env` file

### Container Issues

View logs for a specific service:
```bash
docker-compose logs api-gateway
docker-compose logs user-service
docker-compose logs product-service
```

Rebuild containers:
```bash
docker-compose up --build
```

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:

- Use MongoDB Atlas or a managed MongoDB service
- Set strong JWT_SECRET
- Configure ALLOWED_ORIGINS for CORS
- Set NODE_ENV=production

### Security Considerations

1. Never commit `.env` files to version control
2. Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
3. Enable SSL/TLS for all services
4. Implement proper authentication and authorization
5. Set up monitoring and logging
6. Regular security updates for dependencies

## Additional Resources

- [API Documentation](./API.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Contributing Guide](../CONTRIBUTING.md)
