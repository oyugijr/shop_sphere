const errorHandler = require('../../../src/middlewares/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;
  let consoleErrorSpy;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle errors with custom status code', () => {
    const error = new Error('Custom error');
    error.statusCode = 400;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Custom error'
    });
  });

  it('should default to 500 status code', () => {
    const error = new Error('Server error');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server error'
    });
  });

  it('should include stack trace in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Dev error');

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Dev error',
        stack: expect.any(String)
      })
    );

    delete process.env.NODE_ENV;
  });

  it('should not include stack trace in production mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Prod error');

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Prod error'
    });

    delete process.env.NODE_ENV;
  });

  it('should log error message and stack', () => {
    const error = new Error('Test error');

    errorHandler(error, req, res, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Stack:', error.stack);
  });

  it('should handle errors without message', () => {
    const error = new Error();
    error.statusCode = 404;

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.any(String)
      })
    );
  });
});
