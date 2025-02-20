const express = require("express");
const authControllers = require("../controllers/authControllers");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", authControllers.register);
router.post("/login", authControllers.login);
router.get("/profile", authMiddleware, authControllers.getProfile);

module.exports = router;

