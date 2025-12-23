const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const ShippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const OrderHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    items: [OrderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "mpesa", "paypal", "cash_on_delivery"],
      trim: true
    },
    paymentId: {
      type: String,
      trim: true
    },
    history: [OrderHistorySchema],
    notes: {
      type: String,
      trim: true
    },
    cancelReason: {
      type: String,
      trim: true
    },
    cancelledAt: {
      type: Date
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for common queries
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });

// Generate order number before saving
OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }

  // Add initial history entry
  if (this.isNew) {
    this.history.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created'
    });
  }

  next();
});

// Virtual for order age
OrderSchema.virtual('orderAge').get(function () {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Method to add status history
OrderSchema.methods.addStatusHistory = function (status, note, userId) {
  this.history.push({
    status,
    timestamp: new Date(),
    note,
    updatedBy: userId
  });
};

// Method to check if order can be cancelled
OrderSchema.methods.canBeCancelled = function () {
  return ['pending', 'processing'].includes(this.status) &&
    this.paymentStatus !== 'completed';
};

module.exports = mongoose.model("Order", OrderSchema);
