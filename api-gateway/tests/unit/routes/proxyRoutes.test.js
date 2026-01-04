jest.mock('express-http-proxy', () => jest.fn(() => (req, res, next) => next()));

const proxy = require('express-http-proxy');

describe.each([
    ['orderRoutes', 'http://order-service:5003'],
    ['productRoutes', 'http://product-service:5002'],
    ['userRoutes', 'http://user-service:5001'],
])('%s', (routeFile, expectedUrl) => {
    beforeEach(() => {
        proxy.mockClear();
    });

    it('registers a proxy middleware pointing at the correct upstream service', () => {
        const routePath = require.resolve(`../../../src/routes/${routeFile}`);
        delete require.cache[routePath];
        const router = require(routePath);

        expect(proxy).toHaveBeenCalledWith(expectedUrl);
        expect(typeof router).toBe('function');
        expect(typeof router.use).toBe('function');
    });
});
