// const express = require("express");
// const router = express.Router();
// const productController = require("../controllers/product.controller");

// router.post("/", productController.createProduct);
// router.get("/", productController.getProducts);
// router.get("/:id", productController.getProductById);
// router.put("/:id", productController.updateProduct);
// router.delete("/:id", productController.deleteProduct);

// module.exports = router;

const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middlewares/authMiddleware");
const ProductController = require("../controllers/productController");

const router = express.Router();

// 🔹 Public route: View all products
router.get("/", ProductController.getAllProducts);

// 🔹 Public route: View a single product
router.get("/:id", ProductController.getProductById);

// 🔒 Admin-only routes
router.post("/", authMiddleware, authorizeRoles("admin"), ProductController.createProduct);
router.put("/:id", authMiddleware, authorizeRoles("admin"), ProductController.updateProduct);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), ProductController.deleteProduct);

module.exports = router;
