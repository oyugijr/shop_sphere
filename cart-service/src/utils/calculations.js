/**
 * Calculate subtotal for an item
 * @param {number} quantity - Item quantity
 * @param {number} price - Item price
 * @returns {number} Subtotal rounded to 2 decimal places
 */
const calculateSubtotal = (quantity, price) => {
  return Math.round(quantity * price * 100) / 100;
};

module.exports = {
  calculateSubtotal,
};
