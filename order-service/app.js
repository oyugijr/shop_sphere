const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/config/db");
const orderRoutes = require("./src/routes/orderRoutes");

dotenv.config();
connectDB();

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
  res.status(200).json({ status: "healthy", service: "order-service" });
});

app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
