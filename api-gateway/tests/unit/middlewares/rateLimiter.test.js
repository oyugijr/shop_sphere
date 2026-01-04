describe('Rate Limiter Middleware', () => {
  let req, res, next, rateLimiter;

  beforeEach(() => {
    jest.resetModules();
    rateLimiter = require('../../../src/middlewares/rateLimiter');
    req = {
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow requests below the limit', () => {
    const middleware = rateLimiter(60000, 100);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block requests exceeding the limit', () => {
    const middleware = rateLimiter(60000, 3);

    // Make 3 allowed requests
    middleware(req, res, next);
    middleware(req, res, next);
    middleware(req, res, next);

    // 4th request should be blocked
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Too many requests, please try again later.'
    });
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('should track requests per IP address', () => {
    const middleware = rateLimiter(60000, 2);

    const req1 = { ...req, ip: '127.0.0.1' };
    const req2 = { ...req, ip: '127.0.0.2' };

    // IP1: 2 requests (allowed)
    middleware(req1, res, next);
    middleware(req1, res, next);

    // IP2: 1 request (allowed)
    middleware(req2, res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).not.toHaveBeenCalled();

    // IP1: 3rd request (blocked)
    middleware(req1, res, next);
    expect(res.status).toHaveBeenCalledWith(429);

    // IP2: 2nd request (still allowed)
    jest.clearAllMocks();
    middleware(req2, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should use connection.remoteAddress if ip is not available', () => {
    const middleware = rateLimiter(60000, 2);
    req.ip = undefined;

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should respect custom window and max requests', () => {
    const middleware = rateLimiter(1000, 2);

    middleware(req, res, next);
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
