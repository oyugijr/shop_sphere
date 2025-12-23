const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5005';

/**
 * Verify product availability and get product details
 * @param {string} productId - Product ID
 * @param {string} token - User token for authentication
 * @returns {Promise<object>} Product details
 */
const getProductDetails = async (productId, token) => {
    try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`, {
            headers: {
                Authorization: token
            },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error.message);
        if (error.response?.status === 404) {
            throw new Error(`Product not found: ${productId}`);
        }
        throw new Error('Product service unavailable');
    }
};

/**
 * Verify stock availability for products
 * @param {Array} items - Array of {productId, quantity}
 * @param {string} token - User token for authentication
 * @returns {Promise<Array>} Array of products with details
 */
const verifyProductStock = async (items, token) => {
    const products = [];

    for (const item of items) {
        const product = await getProductDetails(item.productId || item.product, token);

        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        products.push({
            ...product,
            requestedQuantity: item.quantity
        });
    }

    return products;
};

/**
 * Update product stock after order
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to deduct
 * @param {string} token - User token for authentication
 */
const updateProductStock = async (productId, quantity, token) => {
    try {
        await axios.put(
            `${PRODUCT_SERVICE_URL}/api/products/${productId}/stock`,
            { quantity: -quantity },
            {
                headers: {
                    Authorization: token
                },
                timeout: 5000
            }
        );
    } catch (error) {
        console.error(`Error updating stock for product ${productId}:`, error.message);
        throw new Error('Failed to update product stock');
    }
};

/**
 * Get payment details by order ID
 * @param {string} orderId - Order ID
 * @param {string} token - User token for authentication
 * @returns {Promise<object>} Payment details
 */
const getPaymentByOrderId = async (orderId, token) => {
    try {
        const response = await axios.get(`${PAYMENT_SERVICE_URL}/api/payments/order/${orderId}`, {
            headers: {
                Authorization: token
            },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        console.error(`Error fetching payment for order ${orderId}:`, error.message);
        throw new Error('Payment service unavailable');
    }
};

module.exports = {
    getProductDetails,
    verifyProductStock,
    updateProductStock,
    getPaymentByOrderId
};