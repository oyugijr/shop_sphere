const services = require('../../../src/config/services');

describe('service configuration', () => {
    it('exposes the expected service base URLs', () => {
        expect(services).toMatchObject({
            USER_SERVICE_URL: 'http://user-service:5001',
            PRODUCT_SERVICE_URL: 'http://product-service:5002',
            ORDER_SERVICE_URL: 'http://order-service:5003',
        });
    });
});
