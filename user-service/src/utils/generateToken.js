const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

const generateToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

module.exports = generateToken;
