const User = require("../models/User");

const findByEmail = async (email) => await User.findOne({ email });
const findById = async (id) => await User.findById(id);
const createUser = async (userData) => await User.create(userData);

module.exports = { findByEmail, findById, createUser };
