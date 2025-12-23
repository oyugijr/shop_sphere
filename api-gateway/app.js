const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { createProxyMiddleware } = require("http-proxy-middleware");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const errorHandler = require("./src/middlewares/errorHandler");
const requestLogger = require("./src/middlewares/requestLogger");
const rateLimiter = require("./src/middlewares/rateLimiter");
const securityHeaders = require("./src/middlewares/securityHeaders");

const app = express();

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(morgan("dev"));
app.use(requestLogger);

// Apply rate limiting to all routes
app.use(rateLimiter(60000, 100)); // 100 requests per minute

// Routes
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

app.get("/", (req, res) => res.send("API Gateway is Running"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "api-gateway" });
});

// initializes the services
const services = {
    user: "http://user-service:5001",
    product: "http://product-service:5002",
    order: "http://order-service:5003",
    cart: "http://cart-service:5006",
  };
  
  // Middleware to forward requests
  app.use("/api/users", createProxyMiddleware({ target: services.user, changeOrigin: true }));
  app.use("/api/products", createProxyMiddleware({ target: services.product, changeOrigin: true }));
  app.use("/api/orders", createProxyMiddleware({ target: services.order, changeOrigin: true }));
  app.use("/api/cart", createProxyMiddleware({ target: services.cart, changeOrigin: true }));
  
  // Error handling middleware (should be last)
  app.use(errorHandler);
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));

module.exports = app;
