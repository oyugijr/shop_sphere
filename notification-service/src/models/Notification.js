const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ["email", "sms", "whatsapp"], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);