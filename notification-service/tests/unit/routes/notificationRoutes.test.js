const mockAuthMiddleware = jest.fn((req, res, next) => next());
const mockControllerHandlers = {
    sendNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
};

jest.mock('../../../src/middlewares/authMiddleware', () => mockAuthMiddleware);
jest.mock('../../../src/controllers/notificationController', () => mockControllerHandlers);

const router = require('../../../src/routes/notificationRoutes');

describe('notificationRoutes', () => {
    const findRoute = (path) => router.stack.find((layer) => layer.route && layer.route.path === path);

    it('protects the /send endpoint with auth middleware', () => {
        const layer = findRoute('/send');

        expect(layer).toBeDefined();
        expect(layer.route.methods.post).toBe(true);
        expect(layer.route.stack[0].handle).toBe(mockAuthMiddleware);
        expect(layer.route.stack[layer.route.stack.length - 1].handle).toBe(
            mockControllerHandlers.sendNotification
        );
    });

    it('protects the user notifications endpoint', () => {
        const layer = findRoute('/:userId');

        expect(layer.route.methods.get).toBe(true);
        expect(layer.route.stack[0].handle).toBe(mockAuthMiddleware);
        expect(layer.route.stack[layer.route.stack.length - 1].handle).toBe(
            mockControllerHandlers.getUserNotifications
        );
    });

    it('protects the mark-as-read endpoint', () => {
        const layer = findRoute('/:id/read');

        expect(layer.route.methods.patch).toBe(true);
        expect(layer.route.stack[0].handle).toBe(mockAuthMiddleware);
        expect(layer.route.stack[layer.route.stack.length - 1].handle).toBe(
            mockControllerHandlers.markAsRead
        );
    });
});
