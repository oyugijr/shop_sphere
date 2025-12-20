const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    refundId: {
      type: String,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: null,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PaymentSchema.index({ orderId: 1, status: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);
