const validateOrderStatus = (status) => {
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    return allowedStatuses.includes(status);
};

const validatePaymentStatus = (status) => {
    const allowedStatuses = ['pending', 'completed', 'failed', 'refunded'];
    return allowedStatuses.includes(status);
};

const validateOrderItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 'Order must contain at least one item';
    }

    const invalidItem = items.find((item) => !item.productId || !item.quantity || item.quantity <= 0);
    if (invalidItem) {
        return 'Each order item must include productId and positive quantity';
    }

    return null;
};

const validateOrder = ({ items, shippingAddress, totalPrice }) => {
    const errors = [];

    const itemError = validateOrderItems(items);
    if (itemError) {
        errors.push(itemError);
    }

    if (!shippingAddress) {
        errors.push('Shipping address is required');
    }

    if (typeof totalPrice !== 'number' || totalPrice < 0) {
        errors.push('Valid total price is required (must be >= 0)');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateOrderStatus,
    validatePaymentStatus,
    validateOrderItems,
    validateOrder,
};