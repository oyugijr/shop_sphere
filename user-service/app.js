require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./src/routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());

// Routes
app.use("/api/users", userRoutes);

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`🚀 User Service running on port ${PORT}`);
});

// require("dotenv").config();
// const express = require("express");
// const connectDB = require("./config/db");

// const app = express();
// app.use(express.json());

// // Routes
// app.use("/api/users", userRoutes);

// // Connect to MongoDB
// connectDB();

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
