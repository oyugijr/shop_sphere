const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/config/db");
const notificationRoutes = require("./src/routes/notificationRoutes");
const notificationQueue = require("./src/config/queue");
const errorMiddleware = require("./src/middlewares/errorMiddleware");

dotenv.config();
connectDB();

// Initialize notification worker
require("./src/workers/notificationWorker");

const app = express();

// Security middleware
app.use(helmet()); // Set security headers
app.use(express.json({ limit: "10mb" })); // Limit body size
app.use(mongoSanitize()); // Sanitize data against NoSQL injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "notification-service" });
});

app.use("/api/notifications", notificationRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
  console.log(`Notification worker initialized and listening for events`);
});

module.exports = app;
