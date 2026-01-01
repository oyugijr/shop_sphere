const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cors = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const requestMetadata = require("./src/middlewares/requestMetadata");
const { errorHandler, notFound } = require("./src/middlewares/errorHandler");
const { apiLimiter } = require("./src/middlewares/rateLimitMiddleware");
const logger = require("./src/utils/logger");
const fs = require("fs");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize database connection
connectDB();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const app = express();

// Trust proxy (for load balancers and reverse proxies)
app.set('trust proxy', 1);

// Security middlewares
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS
app.use(mongoSanitize()); // Prevent MongoDB injection
app.use(xss()); // Prevent XSS attacks

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request metadata middleware (extract IP and user agent)
app.use(requestMetadata);

// Apply rate limiting to all routes
app.use(apiLimiter);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "user-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});


const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
const server = app.listen(PORT, () => {
  logger.info(`User Service running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});


module.exports = app;

