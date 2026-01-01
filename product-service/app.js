const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/config/db");
const productRoutes = require("./src/routes/product.routes");

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
  res.status(200).json({ status: "healthy", service: "product-service" });
});

app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));

module.exports = app;
