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

