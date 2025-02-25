const userRepository = require("../repositories/userRepository");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");

const registerUser = async (userData) => {
  const existingUser = await userRepository.findByEmail(userData.email);
  if (existingUser) throw new Error("User already exists");

  const user = await userRepository.createUser(userData);
  return generateToken(user);
};

const loginUser = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) throw new Error("Invalid credentials");

  return generateToken(user);
};

module.exports = { registerUser, loginUser };
