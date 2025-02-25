const productService = require("../services/productService");

const getProducts = async (req, res) => {
  try {
    res.json(await productService.getAllProducts());
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const createProduct = async (req, res) => {
  try {
    res.status(201).json(await productService.createProduct(req.body));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };

// const Product = require("../models/Product.model");

// // // @desc Create a new product
// // exports.createProduct = async (req, res) => {
// //   try {
// //     const product = new Product(req.body);
// //     await product.save();
// //     res.status(201).json(product);
// //   } catch (error) {
// //     res.status(400).json({ error: error.message });
// //   }
// // };

// // Create Product
// exports.createProduct = async (req, res) => {
//   try {
//     const product = new Product(req.body);
//     await product.save();
//     res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       data: product,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // // @desc Get all products
// // exports.getProducts = async (req, res) => {
// //   try {
// //     const products = await Product.find();
// //     res.json(products);
// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // };


// // Get All Products
// exports.getProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.status(200).json({ success: true, data: products });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc Get product by ID
// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: "Product not found" });
//     res.json(product);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // @desc Update product
// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(product);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // @desc Delete product
// exports.deleteProduct = async (req, res) => {
//   try {
//     await Product.findByIdAndDelete(req.params.id);
//     res.json({ message: "Product deleted" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // const Product = require("../models/Product");




// // // Get Single Product
// // exports.getProductById = async (req, res) => {
// //   try {
// //     const product = await Product.findById(req.params.id);
// //     if (!product) {
// //       return res.status(404).json({ success: false, message: "Product not found" });
// //     }
// //     res.status(200).json({ success: true, data: product });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // Update Product
// // exports.updateProduct = async (req, res) => {
// //   try {
// //     const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
// //     if (!product) {
// //       return res.status(404).json({ success: false, message: "Product not found" });
// //     }
// //     res.status(200).json({ success: true, message: "Product updated successfully", data: product });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // Delete Product
// // exports.deleteProduct = async (req, res) => {
// //   try {
// //     const product = await Product.findByIdAndDelete(req.params.id);
// //     if (!product) {
// //       return res.status(404).json({ success: false, message: "Product not found" });
// //     }
// //     res.status(200).json({ success: true, message: "Product deleted successfully" });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };
