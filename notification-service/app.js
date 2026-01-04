const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const notificationRoutes = require("./src/routes/notificationRoutes");
const notificationQueue = require("./src/config/queue");
const errorMiddleware = require("./src/middlewares/errorMiddleware");

dotenv.config();
connectDB();

// Initialize notification worker
require("./src/workers/notificationWorker");

const app = express();
app.use(express.json());

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
