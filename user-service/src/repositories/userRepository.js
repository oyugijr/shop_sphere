const User = require("../models/User");

const findByEmail = async (email) => {
  return await User.findOneActive({ email });
};

const findById = async (id) => {
  return await User.findOne({ _id: id, isDeleted: false });
};

const findAll = async (filter = {}, options = {}) => {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;

  const query = { ...filter, isDeleted: false };

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const createUser = async (userData) => {
  return await User.create(userData);
};

const updateUser = async (id, updateData) => {
  // Don't allow updating password through this method
  const { password, role, emailVerified, isDeleted, ...safeUpdateData } = updateData;
  
  return await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: safeUpdateData },
    { new: true, runValidators: true }
  ).select('-password');
};

const updateUserRole = async (id, role) => {
  return await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { role } },
    { new: true, runValidators: true }
  ).select('-password');
};

const updatePassword = async (id, hashedPassword) => {
  return await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { password: hashedPassword, lastPasswordChangedAt: new Date() } },
    { new: true }
  );
};

const softDeleteUser = async (id) => {
  return await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  );
};

const verifyUserEmail = async (id) => {
  return await User.findOneAndUpdate(
    { _id: id },
    { $set: { emailVerified: true, emailVerifiedAt: new Date() } },
    { new: true }
  ).select('-password');
};

const updateLastLogin = async (id) => {
  return await User.findOneAndUpdate(
    { _id: id },
    { $set: { lastLoginAt: new Date() } },
    { new: true }
  );
};

module.exports = { 
  findByEmail, 
  findById, 
  findAll,
  createUser, 
  updateUser,
  updateUserRole,
  updatePassword,
  softDeleteUser,
  verifyUserEmail,
  updateLastLogin
};
