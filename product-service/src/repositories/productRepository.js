const Product = require("../models/Product.model");

/**
 * Find all products with optional filters, sorting, and pagination
 */
const findAll = async (filters = {}, options = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search = ''
    } = options;

    // Build query
    const query = { isDeleted: false, ...filters };

    // Add search if provided
    if (search) {
        query.$text = { $search: search };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination and sorting
    const products = await Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    return {
        products,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};

/**
 * Find product by ID
 */
const findById = async (id) => {
    return await Product.findOne({ _id: id, isDeleted: false });
};

/**
 * Find active products only
 */
const findActive = async (options = {}) => {
    return await findAll({ isActive: true }, options);
};

/**
 * Find products by category
 */
const findByCategory = async (category, options = {}) => {
    return await findAll({ category: category.toLowerCase(), isActive: true }, options);
};

/**
 * Search products by text
 */
const searchProducts = async (searchTerm, options = {}) => {
    return await findAll({}, { ...options, search: searchTerm });
};

/**
 * Create a new product
 */
const create = async (data) => {
    const product = new Product(data);
    return await product.save();
};

/**
 * Update product by ID
 */
const update = async (id, data) => {
    // Remove fields that shouldn't be updated directly
    delete data.isDeleted;
    delete data.createdAt;
    delete data.updatedAt;

    return await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data },
        { new: true, runValidators: true }
    );
};

/**
 * Soft delete product
 */
const remove = async (id) => {
    return await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, isActive: false } },
        { new: true }
    );
};

/**
 * Hard delete product (permanent)
 */
const hardDelete = async (id) => {
    return await Product.findByIdAndDelete(id);
};

/**
 * Update stock quantity
 */
const updateStock = async (id, quantity) => {
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
        return null;
    }

    product.stock = quantity;
    return await product.save();
};

/**
 * Increase stock
 */
const increaseStock = async (id, quantity) => {
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
        return null;
    }

    return await product.increaseStock(quantity);
};

/**
 * Decrease stock
 */
const decreaseStock = async (id, quantity) => {
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
        return null;
    }

    return await product.decreaseStock(quantity);
};

/**
 * Check if product has sufficient stock
 */
const checkStock = async (id, quantity) => {
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
        return { available: false, reason: 'Product not found' };
    }

    if (!product.isActive) {
        return { available: false, reason: 'Product is not active' };
    }

    if (product.stock < quantity) {
        return { available: false, reason: 'Insufficient stock', currentStock: product.stock };
    }

    return { available: true, currentStock: product.stock };
};

/**
 * Bulk create products
 */
const bulkCreate = async (productsData) => {
    return await Product.insertMany(productsData, { ordered: false });
};

/**
 * Bulk update products
 */
const bulkUpdate = async (updates) => {
    const bulkOps = updates.map(({ id, data }) => ({
        updateOne: {
            filter: { _id: id, isDeleted: false },
            update: { $set: data }
        }
    }));

    return await Product.bulkWrite(bulkOps);
};

/**
 * Get product statistics
 */
const getStats = async () => {
    const stats = await Product.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                activeProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                totalStock: { $sum: '$stock' },
                averagePrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        }
    ]);

    return stats[0] || {
        totalProducts: 0,
        activeProducts: 0,
        totalStock: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0
    };
};

/**
 * Get category statistics
 */
const getCategoryStats = async () => {
    return await Product.aggregate([
        { $match: { isDeleted: false, isActive: true } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalStock: { $sum: '$stock' },
                averagePrice: { $avg: '$price' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

module.exports = {
    findAll,
    findById,
    findActive,
    findByCategory,
    searchProducts,
    create,
    update,
    remove,
    hardDelete,
    updateStock,
    increaseStock,
    decreaseStock,
    checkStock,
    bulkCreate,
    bulkUpdate,
    getStats,
    getCategoryStats
};
