const errorMiddleware = require('../../../src/middlewares/errorMiddleware');

describe('errorMiddleware', () => {
    const originalEnv = process.env.NODE_ENV;

    afterAll(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('formats errors and returns stack traces outside production', () => {
        process.env.NODE_ENV = 'test';
        const err = new Error('Boom');
        err.statusCode = 418;
        const res = { headersSent: false };
        res.status = jest.fn(() => res);
        res.json = jest.fn();
        const next = jest.fn();

        errorMiddleware(err, {}, res, next);

        expect(res.status).toHaveBeenCalledWith(418);
        expect(res.json).toHaveBeenCalledWith({ error: 'Boom', stack: err.stack });
        expect(next).not.toHaveBeenCalled();
    });

    it('delegates to next when headers were already sent', () => {
        process.env.NODE_ENV = 'production';
        const err = new Error('late write');
        const res = { headersSent: true };
        res.status = jest.fn(() => res);
        res.json = jest.fn();
        const next = jest.fn();

        errorMiddleware(err, {}, res, next);

        expect(next).toHaveBeenCalledWith(err);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('omits stack traces in production responses', () => {
        process.env.NODE_ENV = 'production';
        const err = new Error('Failure');
        const res = { headersSent: false };
        res.status = jest.fn(() => res);
        res.json = jest.fn();
        const next = jest.fn();

        errorMiddleware(err, {}, res, next);

        expect(res.json).toHaveBeenCalledWith({ error: 'Failure' });
        expect(next).not.toHaveBeenCalled();
    });
});
