const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// For tests, allow a test secret
if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  throw new Error('JWT_SECRET is required in environment variables');
}

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  
  if (!token) {
    return res.status(401).json({ 
      error: "Access denied. No token provided." 
    });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET || 'test-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).json({ 
      error: "Invalid token" 
    });
  }
};

module.exports = authMiddleware;
