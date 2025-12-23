const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { apiLimiter } = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Protected user routes (authenticated users)
router.get("/profile", authMiddleware, userController.getUserProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.put("/password", authMiddleware, userController.changePassword);
router.get("/audit-logs", authMiddleware, userController.getAuditLogs);

// Admin routes (require admin role)
router.get("/", authMiddleware, roleMiddleware("admin"), userController.getAllUsers);
router.get("/:id", authMiddleware, roleMiddleware("admin"), userController.getUserById);
router.put("/:id/role", authMiddleware, roleMiddleware("admin"), userController.updateUserRole);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), userController.deleteUser);
router.get("/:id/audit-logs", authMiddleware, roleMiddleware("admin"), userController.getUserAuditLogsById);

module.exports = router;

