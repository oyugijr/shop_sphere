const productRepository = require("../repositories/productRepository");

const getAllProducts = async () => await productRepository.findAll();
const getProductById = async (id) => await productRepository.findById(id);
const createProduct = async (productData) => await productRepository.create(productData);
const updateProduct = async (id, productData) => await productRepository.update(id, productData);
const deleteProduct = async (id) => await productRepository.remove(id);

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
