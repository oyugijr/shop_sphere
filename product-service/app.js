const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "product-service" });
});

app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));

module.exports = app;
