const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../src/middlewares/authMiddleware');

jest.mock(
    'jsonwebtoken',
    () => ({
        verify: jest.fn(),
    }),
    { virtual: true }
);

const buildResponse = () => {
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
        res = buildResponse();
        jwt.verify.mockReset();
    });

    it('attaches the decoded user and calls next for valid tokens', () => {
        const req = {
            header: jest.fn().mockReturnValue('Bearer valid-token'),
        };
        const decoded = { id: 'user-123', role: 'admin' };
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'your_jwt_secret');
        expect(req.user).toEqual(decoded);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('responds with 401 when no Authorization header is present', () => {
        const req = {
            header: jest.fn().mockReturnValue(null),
        };

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
        expect(next).not.toHaveBeenCalled();
    });

    it('responds with 403 when the token cannot be verified', () => {
        const req = {
            header: jest.fn().mockReturnValue('Bearer bad-token'),
        };
        jwt.verify.mockImplementation(() => {
            throw new Error('invalid token');
        });

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('bad-token', 'your_jwt_secret');
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });
});
