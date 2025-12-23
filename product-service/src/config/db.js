const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async (retryCount = 0) => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    
    logger.info("Connected to MongoDB successfully", {
      database: mongoose.connection.name,
      host: mongoose.connection.host
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error("MongoDB connection error", { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on('reconnected', () => {
      logger.info("MongoDB reconnected successfully");
    });

  } catch (error) {
    logger.error("MongoDB connection failed", {
      error: error.message,
      retryCount,
      maxRetries: MAX_RETRIES
    });

    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying connection in ${RETRY_INTERVAL / 1000} seconds...`, {
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES
      });
      
      setTimeout(() => {
        connectDB(retryCount + 1);
      }, RETRY_INTERVAL);
    } else {
      logger.error("Max retries reached. Could not connect to MongoDB. Exiting...");
      process.exit(1);
    }
  }
};

/**
 * Close database connection gracefully
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
  } catch (error) {
    logger.error("Error closing MongoDB connection", { error: error.message });
    throw error;
  }
};

module.exports = connectDB;
module.exports.closeDB = closeDB;
