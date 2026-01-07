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
    provider: {
      type: String,
      enum: ['stripe', 'mpesa', 'paypal'],
      required: true,
      default: 'stripe',
      index: true,
    },
    // Stripe fields
    stripePaymentIntentId: {
      type: String,
      sparse: true,
      index: true,
    },
    // M-Pesa fields
    mpesaCheckoutRequestId: {
      type: String,
      sparse: true,
      index: true,
    },
    mpesaTransactionId: {
      type: String,
      sparse: true,
      index: true,
    },
    mpesaReceiptNumber: {
      type: String,
      sparse: true,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    // PayPal fields
    paypalOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    paypalCaptureId: {
      type: String,
      sparse: true,
      index: true,
    },
    paypalPayerEmail: {
      type: String,
      default: null,
    },
    paypalPayerId: {
      type: String,
      default: null,
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
    // Fraud detection fields
    fraudDetection: {
      enabled: {
        type: Boolean,
        default: false,
      },
      riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      action: {
        type: String,
        enum: ['allow', 'soft_challenge', 'hard_challenge', 'block', null],
        default: null,
      },
      reasons: [{
        type: String,
      }],
      sessionId: {
        type: String,
        default: null,
      },
      requestId: {
        type: String,
        default: null,
      },
      checkedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PaymentSchema.index({ orderId: 1, status: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ provider: 1, status: 1 });

// Validation: require provider-specific fields
PaymentSchema.pre('save', function (next) {
  if (this.provider === 'stripe' && !this.stripePaymentIntentId) {
    return next(new Error('stripePaymentIntentId is required for Stripe payments'));
  }
  if (this.provider === 'mpesa' && !this.mpesaCheckoutRequestId) {
    return next(new Error('mpesaCheckoutRequestId is required for M-Pesa payments'));
  }
  if (this.provider === 'paypal' && !this.paypalOrderId) {
    return next(new Error('paypalOrderId is required for PayPal payments'));
  }
  next();
});

module.exports = mongoose.model("Payment", PaymentSchema);
