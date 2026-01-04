const requestLogger = require('../../../src/middlewares/requestLogger');

describe('requestLogger middleware', () => {
    const originalLog = console.log;

    beforeEach(() => {
        console.log = jest.fn();
    });

    afterEach(() => {
        console.log = originalLog;
        jest.clearAllMocks();
    });

    it('registers a finish handler that logs request metadata', () => {
        const handlers = {};
        const res = {
            statusCode: 200,
            on: jest.fn((event, handler) => {
                handlers[event] = handler;
            }),
        };
        const req = { method: 'GET', originalUrl: '/health' };
        const next = jest.fn();

        requestLogger(req, res, next);

        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
        expect(next).toHaveBeenCalledTimes(1);

        handlers.finish();

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('GET /health - 200 -')
        );
    });
});
