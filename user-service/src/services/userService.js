const userRepository = require("../repositories/userRepository");

const getUserById = async (id) => await userRepository.findById(id);

module.exports = { getUserById };
