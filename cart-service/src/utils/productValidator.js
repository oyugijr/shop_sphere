const axios = require("axios");

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-service:5002";

/**
 * Validate product exists and has sufficient stock
 * @param {string} productId - Product ID
 * @param {number} quantity - Requested quantity
 * @returns {Promise<Object>} - Product data
 * @throws {Error} - If product not found or insufficient stock
 */
const validateProduct = async (productId, quantity) => {
  try {
    // Call product service to get product details
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`, {
      timeout: 5000, // 5 second timeout
    });

    const product = response.data;

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if product has sufficient stock
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    return product;
  } catch (error) {
    if (error.response) {
      // Product service returned an error
      if (error.response.status === 404) {
        throw new Error("Product not found");
      }
      throw new Error(`Product validation failed: ${error.response.data.error || error.message}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error("Product service is unavailable");
    } else {
      // Something else went wrong
      throw error;
    }
  }
};

module.exports = {
  validateProduct,
};
