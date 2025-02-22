const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/users", userRoutes);
app.use("/products", productRoutes);

app.get("/", (req, res) => res.send("API Gateway is Running"));

module.exports = app;
