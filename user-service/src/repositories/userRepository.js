const User = require("../models/User");

class UserRepository {
  async create(userData) {
    return await User.create(userData);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findById(userId) {
    return await User.findById(userId);
  }
  async update(userId, userData) {
    return await User.findByIdAndUpdate
  }
  // update the user roles 
  async updateRole(userId, role) {
    return await User.findByIdAndUpdate
  }
}

module.exports = new UserRepository();
