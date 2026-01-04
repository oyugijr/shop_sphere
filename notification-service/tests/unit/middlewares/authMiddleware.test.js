jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../src/middlewares/authMiddleware');

const buildRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn();
    return res;
};

describe('authMiddleware', () => {
    let next;
    let res;

    beforeEach(() => {
        next = jest.fn();
        res = buildRes();
        jwt.verify.mockReset();
    });

    afterAll(() => {
        process.env.JWT_SECRET = originalSecret;
        jest.resetModules();
    });

    it('attaches decoded user to the request and calls next for valid tokens', () => {
        const req = { header: jest.fn().mockReturnValue('Bearer valid-token') };
        const decodedUser = { id: 'user-1' };
        jwt.verify.mockReturnValue(decodedUser);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
        expect(req.user).toEqual(decodedUser);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when the Authorization header is missing', () => {
        const req = { header: jest.fn().mockReturnValue(null) };

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when verification fails', () => {
        const req = { header: jest.fn().mockReturnValue('Bearer bad-token') };
        jwt.verify.mockImplementation(() => {
            throw new Error('invalid token');
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });
});
