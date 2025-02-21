const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

class AuthService {
  async register(userData) {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) throw new Error("Email already in use");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    return await userRepository.create({ name, email, password: hashedPassword });
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password");

    // Generate JWT Token
    const token = (user) => {
        return jwt.sign(
            { userId: user._id, email: user.email, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );
    }

    return { user, token, role };
  }


  async getUserProfile(userId) {
    return await userRepository.findById(userId);
  }
}


module.exports = new AuthService();
