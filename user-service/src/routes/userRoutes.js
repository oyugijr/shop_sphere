// const express = require("express");
// const authControllers = require("../controllers/authControllers");
// const {authMiddleware, authorizeRoles } = require("../middlewares/authMiddleware");

// const router = express.Router();

// router.post("/admin-only", authMiddleware, authorizeRoles("admin"), (req, res) => {
//   res.json({ message: "This is an admin-only route!" });
// });

// router.get("/admin-dashboard", verifyAdmin, (req, res) => {
//     res.json({ message: "Welcome, Admin!" });
//   });

// router.get("/user-dashboard", authMiddleware, (req, res) => {
//   res.json({ message: "Welcome to the user dashboard!" });
// });

// router.post("/register", authControllers.register);
// router.post("/login", authControllers.login);
// router.get("/profile", authMiddleware, authControllers.getProfile);

// module.exports = router;

const express = require("express");
const { getUserProfile } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/profile", authMiddleware, getUserProfile);

module.exports = router;

