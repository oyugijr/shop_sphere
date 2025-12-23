const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: "Access denied. No token provided." 
    });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  
  if (!token) {
    return res.status(401).json({ 
      error: "Invalid token format." 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "Token has expired." 
      });
    }
    return res.status(401).json({ 
      error: "Invalid token." 
    });
  }
};

module.exports = authMiddleware;
