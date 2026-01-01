const securityHeaders = require('../../src/middlewares/securityHeaders');

describe('Security Headers Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it('should set X-Frame-Options header', () => {
    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  it('should set X-Content-Type-Options header', () => {
    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });

  it('should set X-XSS-Protection header', () => {
    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
  });

  it('should set Content-Security-Policy header', () => {
    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', "default-src 'self'");
  });

  it('should set Referrer-Policy header', () => {
    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
  });

  it('should set Permissions-Policy header', () => {
    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  });

  it('should set Strict-Transport-Security header in production', () => {
    process.env.NODE_ENV = 'production';

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  });

  it('should not set Strict-Transport-Security header in development', () => {
    process.env.NODE_ENV = 'development';

    securityHeaders(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.any(String)
    );
  });

  it('should call next middleware', () => {
    securityHeaders(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should set all required security headers', () => {
    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledTimes(6);
  });

  it('should set all headers including HSTS in production', () => {
    process.env.NODE_ENV = 'production';

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledTimes(7);
  });
});
