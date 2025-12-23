const productService = require("../services/productService");
const { 
  validateProduct, 
  validateProductUpdate, 
  sanitizeInput,
  validatePagination,
  validateStockOperation 
} = require("../utils/validation");
const { asyncHandler, ValidationError } = require("../utils/errorHandler");
const logger = require("../utils/logger");

/**
 * Get all products with pagination, filtering, and sorting
 * GET /api/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '', category = '', active } = req.query;
  
  // Validate pagination
  const pageValidation = validatePagination(page, limit);
  if (!pageValidation.isValid) {
    throw new ValidationError('Invalid pagination parameters', pageValidation.errors);
  }
  
  const options = {
    page: pageValidation.page,
    limit: pageValidation.limit,
    sortBy,
    sortOrder,
    search
  };
  
  let result;
  
  if (category) {
    result = await productService.getProductsByCategory(category, options);
  } else if (active === 'true') {
    result = await productService.getActiveProducts(options);
  } else if (search) {
    result = await productService.searchProducts(search, options);
  } else {
    result = await productService.getAllProducts(options);
  }
  
  logger.info('Products fetched successfully', { 
    count: result.products.length,
    page: result.pagination.page,
    total: result.pagination.total
  });
  
  res.status(200).json(result);
});

/**
 * Get a single product by ID
 * GET /api/products/:id
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  
  logger.info('Product fetched successfully', { productId: product._id });
  
  res.status(200).json(product);
});

/**
 * Create a new product
 * POST /api/products
 */
const createProduct = asyncHandler(async (req, res) => {
  // Sanitize input
  const sanitizedData = sanitizeInput(req.body);
  
  // Validate product data
  const validation = validateProduct(sanitizedData);
  if (!validation.isValid) {
    throw new ValidationError('Product validation failed', validation.errors);
  }
  
  const product = await productService.createProduct(sanitizedData);
  
  logger.info('Product created successfully', { 
    productId: product._id,
    name: product.name,
    userId: req.user?.id
  });
  
  res.status(201).json({
    message: 'Product created successfully',
    product
  });
});

/**
 * Update a product
 * PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  // Sanitize input
  const sanitizedData = sanitizeInput(req.body);
  
  // Validate update data
  const validation = validateProductUpdate(sanitizedData);
  if (!validation.isValid) {
    throw new ValidationError('Product update validation failed', validation.errors);
  }
  
  const product = await productService.updateProduct(req.params.id, sanitizedData);
  
  logger.info('Product updated successfully', { 
    productId: product._id,
    userId: req.user?.id
  });
  
  res.status(200).json({
    message: 'Product updated successfully',
    product
  });
});

/**
 * Delete a product (soft delete)
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id);
  
  logger.info('Product deleted successfully', { 
    productId: product._id,
    userId: req.user?.id
  });
  
  res.status(200).json({
    message: 'Product deleted successfully',
    product
  });
});

/**
 * Get products by category
 * GET /api/products/category/:category
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  const pageValidation = validatePagination(page, limit);
  if (!pageValidation.isValid) {
    throw new ValidationError('Invalid pagination parameters', pageValidation.errors);
  }
  
  const result = await productService.getProductsByCategory(req.params.category, {
    page: pageValidation.page,
    limit: pageValidation.limit,
    sortBy,
    sortOrder
  });
  
  logger.info('Products by category fetched', { 
    category: req.params.category,
    count: result.products.length
  });
  
  res.status(200).json(result);
});

/**
 * Search products
 * GET /api/products/search
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  if (!q) {
    throw new ValidationError('Search query is required', ['Query parameter "q" is required']);
  }
  
  const pageValidation = validatePagination(page, limit);
  if (!pageValidation.isValid) {
    throw new ValidationError('Invalid pagination parameters', pageValidation.errors);
  }
  
  const result = await productService.searchProducts(q, {
    page: pageValidation.page,
    limit: pageValidation.limit,
    sortBy,
    sortOrder
  });
  
  logger.info('Product search completed', { 
    query: q,
    count: result.products.length
  });
  
  res.status(200).json(result);
});

/**
 * Update product stock
 * PATCH /api/products/:id/stock
 */
const updateStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  
  const validation = validateStockOperation(quantity);
  if (!validation.isValid) {
    throw new ValidationError('Stock validation failed', validation.errors);
  }
  
  const product = await productService.updateProductStock(req.params.id, quantity);
  
  logger.info('Product stock updated', { 
    productId: product._id,
    newStock: product.stock,
    userId: req.user?.id
  });
  
  res.status(200).json({
    message: 'Stock updated successfully',
    product
  });
});

/**
 * Increase product stock
 * POST /api/products/:id/stock/increase
 */
const increaseStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  
  const validation = validateStockOperation(quantity);
  if (!validation.isValid) {
    throw new ValidationError('Stock validation failed', validation.errors);
  }
  
  const product = await productService.increaseProductStock(req.params.id, quantity);
  
  logger.info('Product stock increased', { 
    productId: product._id,
    increaseBy: quantity,
    newStock: product.stock,
    userId: req.user?.id
  });
  
  res.status(200).json({
    message: 'Stock increased successfully',
    product
  });
});

/**
 * Decrease product stock
 * POST /api/products/:id/stock/decrease
 */
const decreaseStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  
  const validation = validateStockOperation(quantity);
  if (!validation.isValid) {
    throw new ValidationError('Stock validation failed', validation.errors);
  }
  
  const product = await productService.decreaseProductStock(req.params.id, quantity);
  
  logger.info('Product stock decreased', { 
    productId: product._id,
    decreaseBy: quantity,
    newStock: product.stock,
    userId: req.user?.id
  });
  
  res.status(200).json({
    message: 'Stock decreased successfully',
    product
  });
});

/**
 * Check product stock availability
 * GET /api/products/:id/stock/check
 */
const checkStock = asyncHandler(async (req, res) => {
  const { quantity } = req.query;
  
  if (!quantity) {
    throw new ValidationError('Quantity parameter is required');
  }
  
  const quantityNum = parseInt(quantity);
  const validation = validateStockOperation(quantityNum);
  if (!validation.isValid) {
    throw new ValidationError('Stock validation failed', validation.errors);
  }
  
  const result = await productService.checkProductStock(req.params.id, quantityNum);
  
  logger.info('Stock check performed', { 
    productId: req.params.id,
    requestedQuantity: quantityNum,
    available: result.available
  });
  
  res.status(200).json(result);
});

/**
 * Bulk create products
 * POST /api/products/bulk
 */
const bulkCreate = asyncHandler(async (req, res) => {
  const { products } = req.body;
  
  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new ValidationError('Products array is required and must not be empty');
  }
  
  // Validate each product
  for (let i = 0; i < products.length; i++) {
    const sanitizedData = sanitizeInput(products[i]);
    const validation = validateProduct(sanitizedData);
    if (!validation.isValid) {
      throw new ValidationError(`Validation failed for product at index ${i}`, validation.errors);
    }
    products[i] = sanitizedData;
  }
  
  const result = await productService.bulkCreateProducts(products);
  
  logger.info('Bulk product creation completed', { 
    count: result.length,
    userId: req.user?.id
  });
  
  res.status(201).json({
    message: `${result.length} products created successfully`,
    products: result
  });
});

/**
 * Get product statistics
 * GET /api/products/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await productService.getProductStats();
  
  logger.info('Product statistics fetched');
  
  res.status(200).json(stats);
});

/**
 * Get category statistics
 * GET /api/products/stats/categories
 */
const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await productService.getCategoryStats();
  
  logger.info('Category statistics fetched');
  
  res.status(200).json(stats);
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  updateStock,
  increaseStock,
  decreaseStock,
  checkStock,
  bulkCreate,
  getStats,
  getCategoryStats
};
