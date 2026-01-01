const productRepository = require("../repositories/productRepository");
const { isValidObjectId } = require("../utils/validation");
const { NotFoundError, ValidationError } = require("../utils/errorHandler");

/**
 * Get all products with pagination, filtering, and sorting
 */
const getAllProducts = async (options = {}) => {
    return await productRepository.findAll({}, options);
};

/**
 * Get active products only
 */
const getActiveProducts = async (options = {}) => {
    return await productRepository.findActive(options);
};

/**
 * Get product by ID
 */
const getProductById = async (id) => {
    if (!isValidObjectId(id)) {
        throw new ValidationError('Invalid product ID format');
    }

    const product = await productRepository.findById(id);
    if (!product) {
        throw new NotFoundError('Product');
    }

    return product;
};

/**
 * Get products by category
 */
const getProductsByCategory = async (category, options = {}) => {
    if (!category || typeof category !== 'string') {
        throw new ValidationError('Valid category is required');
    }

    return await productRepository.findByCategory(category, options);
};

/**
 * Search products
 */
const searchProducts = async (searchTerm, options = {}) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
        throw new ValidationError('Search term is required');
    }

    return await productRepository.searchProducts(searchTerm, options);
};

/**
 * Create a new product
 */
const createProduct = async (productData) => {
    return await productRepository.create(productData);
};

/**
 * Update a product
 */
const updateProduct = async (id, productData) => {
    if (!isValidObjectId(id)) {
        throw new ValidationError('Invalid product ID format');
    }

    const product = await productRepository.update(id, productData);
    if (!product) {
        throw new NotFoundError('Product');
    }

    return product;
};

/**
 * Delete a product (soft delete)
 */
const deleteProduct = async (id) => {
    if (!isValidObjectId(id)) {
        throw new ValidationError('Invalid product ID format');
    }

    const product = await productRepository.remove(id);
    if (!product) {
        throw new NotFoundError('Product');
    }

    return product;
};

/**
 * Permanently delete a product
 */
const permanentlyDeleteProduct = async (id) => {
    if (!isValidObjectId(id)) {
        throw new ValidationError('Invalid product ID format');
    }

    const product = await productRepository.hardDelete(id);
    if (!product) {
        throw new NotFoundError('Product');
    }

    return product;
};

/**
 * Update product stock
 */
const updateProductStock = async (id, quantity) => {
    if (!isValidObjectId(id)) {
        throw new ValidationError('Invalid product ID format');
    }

    if (typeof quantity !== 'number' || quantity < 0) {
        throw new ValidationError('Stock quantity must be a non-negative number');
    }

    const product = await productRepository.updateStock(id, quantity);
    if (!product) {
        throw new NotFoundError('Product');
    }

    return product;
};

/**
 * Increase product stock
 */
const increaseProductStock = async (id, quantity) => {
    if (!isValidObjectId(id)) {
        throw new ValidationError('Invalid product ID format');
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
        throw new ValidationError('Quantity must be a positive number');
    }

    const product = await productRepository.increaseStock(id, quantity);
    if (!product) {
        throw new NotFoundError('Product');
    }

    return product;
};

/**
 * Decrease product stock
 */
const decreaseProductStock = async (id, quantity) => {
    if (!isValidObjectId(id)) {
        throw new ValidationError('Invalid product ID format');
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
        throw new ValidationError('Quantity must be a positive number');
    }

    const product = await productRepository.decreaseStock(id, quantity);
    if (!product) {
        throw new NotFoundError('Product');
    }

    return product;
};

/**
 * Check product stock availability
 */
const checkProductStock = async (id, quantity) => {
    if (!isValidObjectId(id)) {
        throw new ValidationError('Invalid product ID format');
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
        throw new ValidationError('Quantity must be a positive number');
    }

    return await productRepository.checkStock(id, quantity);
};

/**
 * Bulk create products
 */
const bulkCreateProducts = async (productsData) => {
    if (!Array.isArray(productsData) || productsData.length === 0) {
        throw new ValidationError('Products data must be a non-empty array');
    }

    return await productRepository.bulkCreate(productsData);
};

/**
 * Bulk update products
 */
const bulkUpdateProducts = async (updates) => {
    if (!Array.isArray(updates) || updates.length === 0) {
        throw new ValidationError('Updates must be a non-empty array');
    }

    // Validate all product IDs
    for (const update of updates) {
        if (!isValidObjectId(update.id)) {
            throw new ValidationError(`Invalid product ID: ${update.id}`);
        }
    }

    return await productRepository.bulkUpdate(updates);
};

/**
 * Get product statistics
 */
const getProductStats = async () => {
    return await productRepository.getStats();
};

/**
 * Get category statistics
 */
const getCategoryStats = async () => {
    return await productRepository.getCategoryStats();
};

module.exports = {
    getAllProducts,
    getActiveProducts,
    getProductById,
    getProductsByCategory,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    permanentlyDeleteProduct,
    updateProductStock,
    increaseProductStock,
    decreaseProductStock,
    checkProductStock,
    bulkCreateProducts,
    bulkUpdateProducts,
    getProductStats,
    getCategoryStats
};
