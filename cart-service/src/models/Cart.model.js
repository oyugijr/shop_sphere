const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product ID is required"],
  },
  name: {
    type: String,
    required: [true, "Product name is required"],
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Price cannot be negative"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
    validate: {
      validator: Number.isInteger,
      message: "Quantity must be an integer",
    },
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, "Subtotal cannot be negative"],
  },
});

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
      validate: {
        validator: function (items) {
          // Validate no duplicate products in cart
          const productIds = items.map((item) => item.productId.toString());
          return productIds.length === new Set(productIds).size;
        },
        message: "Cart cannot contain duplicate products",
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
    totalItems: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Total items cannot be negative"],
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
CartSchema.index({ userId: 1 });
CartSchema.index({ updatedAt: -1 });

// Method to calculate totals
CartSchema.methods.calculateTotals = function () {
  this.totalPrice = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  // Round to 2 decimal places to avoid floating point issues
  this.totalPrice = Math.round(this.totalPrice * 100) / 100;
  return this;
};

// Pre-save middleware to calculate totals
CartSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    this.calculateTotals();
  }
  next();
});

module.exports = mongoose.model("Cart", CartSchema);
