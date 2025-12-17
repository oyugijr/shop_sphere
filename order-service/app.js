const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("./config/db");
const orderRoutes = require("./routes/orderRoutes");

dotenv.config();

const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "order-service" });
});

app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
