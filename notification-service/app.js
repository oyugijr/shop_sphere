const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const notificationRoutes = require("./src/routes/notificationRoutes");
const notificationQueue = require("./src/config/queue");
const errorMiddleware = require("./src/middlewares/errorMiddleware");

dotenv.config();

// Connect to database
connectDB();

// Initialize notification worker
require("./src/workers/notificationWorker");

const app = express();
app.use(express.json());

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    service: "notification-service",
    timestamp: new Date().toISOString()
  });
});

// Detailed health check with queue status
app.get("/health/detailed", async (req, res) => {
  try {
    const queueHealth = await notificationQueue.getHealthStatus();
    
    res.status(200).json({
      service: "notification-service",
      status: queueHealth.status === 'healthy' ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      queue: queueHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      service: "notification-service",
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe for Kubernetes
app.get("/ready", async (req, res) => {
  try {
    // Check if queue is accessible
    await notificationQueue.isReady();
    res.status(200).json({ 
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      ready: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe for Kubernetes
app.get("/live", (req, res) => {
  res.status(200).json({ 
    alive: true,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5004;
const server = app.listen(PORT, () => {
  console.log(`✓ Notification Service running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Notification worker initialized and listening for events`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new requests
  server.close(async () => {
    console.log('✓ HTTP server closed');
    
    try {
      // Close notification queue
      await notificationQueue.close();
      console.log('✓ Notification queue closed');
      
      // Close database connection
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('✓ Database connection closed');
      
      console.log('✓ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('✗ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('✗ Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000); // 30 seconds timeout
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
