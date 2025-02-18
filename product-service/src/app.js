const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const productRoutes = require("./routes/product.routes");
const connectDB = require("./config/database");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to database
connectDB();

// Routes
app.use("/api/products", productRoutes);

// Start the server
app.listen(PORT, () => console.log(`🚀 Product Service running on port ${PORT}`));
