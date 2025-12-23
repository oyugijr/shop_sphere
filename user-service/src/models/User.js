const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: { 
      type: String, 
      unique: true, 
      required: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ["user", "admin"], 
      default: "user" 
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    phone: {
      type: String,
      default: null,
      trim: true
    },
    address: {
      street: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      country: { type: String, default: null },
      zipCode: { type: String, default: null }
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    lastPasswordChangedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ isDeleted: 1 });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  
  // Update lastPasswordChangedAt if password is being changed (not on creation)
  if (!this.isNew) {
    this.lastPasswordChangedAt = new Date();
  }
  
  next();
});

// Method to soft delete user
UserSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to verify email
UserSchema.methods.verifyEmail = function() {
  this.emailVerified = true;
  this.emailVerifiedAt = new Date();
  return this.save();
};

// Method to update last login
UserSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Static method to find active (non-deleted) users only
UserSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

UserSchema.statics.findOneActive = function(filter = {}) {
  return this.findOne({ ...filter, isDeleted: false });
};

module.exports = mongoose.model("User", UserSchema);
