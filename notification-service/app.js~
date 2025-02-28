const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const notificationRoutes = require("./src/routes/notificationRoutes");
const notificationQueue = require("./src/config/queue");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));

module.exports = app;
