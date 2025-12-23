const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: { 
      type: String, 
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Product description must be at least 10 characters long'],
      maxlength: [2000, 'Product description cannot exceed 2000 characters']
    },
    price: { 
      type: Number, 
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    stock: { 
      type: Number, 
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    category: { 
      type: String, 
      required: [true, 'Product category is required'],
      trim: true,
      lowercase: true
    },
    imageUrl: { 
      type: String,
      trim: true
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },
    brand: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ isActive: 1, isDeleted: 1 });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ createdAt: -1 });

// Virtual for availability
ProductSchema.virtual('isAvailable').get(function() {
  return this.isActive && !this.isDeleted && this.stock > 0;
});

// Pre-save hook to generate SKU if not provided
ProductSchema.pre('save', function(next) {
  if (!this.sku && this.isNew) {
    this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Method to decrease stock
ProductSchema.methods.decreaseStock = function(quantity) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.stock -= quantity;
  return this.save();
};

// Method to increase stock
ProductSchema.methods.increaseStock = function(quantity) {
  this.stock += quantity;
  return this.save();
};

// Static method to find active products
ProductSchema.statics.findActive = function() {
  return this.find({ isActive: true, isDeleted: false });
};

// Static method to find by category
ProductSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category.toLowerCase(), 
    isActive: true, 
    isDeleted: false 
  });
};

module.exports = mongoose.model("Product", ProductSchema);
