const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { createProxyMiddleware } = require("http-proxy-middleware");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const orderRoutes = require("./src/routes/orderRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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
  };
  
  // Middleware to forward requests
  app.use("/api/users", createProxyMiddleware({ target: services.user, changeOrigin: true }));
  app.use("/api/products", createProxyMiddleware({ target: services.product, changeOrigin: true }));
  app.use("/api/orders", createProxyMiddleware({ target: services.order, changeOrigin: true }));
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));



module.exports = app;
