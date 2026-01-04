const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, enum: ["email", "sms", "whatsapp"], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["pending", "sent", "failed"], default: "pending", index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date },
}, { timestamps: true });

// Index for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
