const orderController = require('../../../src/controllers/orderController');
const orderService = require('../../../src/services/orderService');

jest.mock('../../../src/services/orderService');

describe('Order Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: '507f1f77bcf86cd799439011', role: 'user' },
      header: jest.fn().mockReturnValue('Bearer token'),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const mockOrder = { _id: 'order1', orderNumber: 'ORD-1' };
      req.body = { items: [], totalPrice: 100 };
      orderService.createOrder.mockResolvedValue(mockOrder);

      await orderController.createOrder(req, res, next);

      expect(orderService.createOrder).toHaveBeenCalledWith(req.user.id, req.body, 'Bearer token');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Order created successfully',
        data: mockOrder,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward errors to next handler', async () => {
      const error = new Error('boom');
      orderService.createOrder.mockRejectedValue(error);

      await orderController.createOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getOrderById', () => {
    it('should include admin flag when calling service', async () => {
      const mockOrder = { _id: 'order1' };
      req.params.id = 'order1';
      orderService.getOrderById.mockResolvedValue(mockOrder);

      await orderController.getOrderById(req, res, next);

      expect(orderService.getOrderById).toHaveBeenCalledWith('order1', req.user.id, false);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockOrder });
    });

    it('should pass errors downstream', async () => {
      const error = new Error('not found');
      req.params.id = 'order1';
      orderService.getOrderById.mockRejectedValue(error);

      await orderController.getOrderById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserOrders', () => {
    it('should forward options to service', async () => {
      req.query = { page: '2', limit: '5', status: 'pending', paymentStatus: 'pending' };
      const mockResult = {
        orders: [{ _id: 'order1' }],
        pagination: { page: 2, limit: 5 },
      };
      orderService.getUserOrders.mockResolvedValue(mockResult);

      await orderController.getUserOrders(req, res, next);

      expect(orderService.getUserOrders).toHaveBeenCalledWith(
        req.user.id,
        expect.objectContaining({ page: 2, limit: 5, status: 'pending', paymentStatus: 'pending' })
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockResult.orders, pagination: mockResult.pagination });
    });

    it('should pass errors to next', async () => {
      const error = new Error('db error');
      orderService.getUserOrders.mockRejectedValue(error);

      await orderController.getUserOrders(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateOrderStatus', () => {
    it('should validate status and invoke service', async () => {
      const mockOrder = { _id: 'order1', status: 'shipped' };
      req.params.id = 'order1';
      req.body = { status: 'shipped', note: 'Packed' };
      orderService.updateOrderStatus.mockResolvedValue(mockOrder);

      await orderController.updateOrderStatus(req, res, next);

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order1', 'shipped', req.user.id, 'Packed');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Order status updated successfully',
        data: mockOrder,
      });
    });

    it('should reject invalid statuses', async () => {
      req.body = { status: 'invalid' };

      await orderController.updateOrderStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid status',
        message: 'Status must be one of: pending, processing, shipped, delivered, cancelled',
      });
      expect(orderService.updateOrderStatus).not.toHaveBeenCalled();
    });

    it('should forward service errors', async () => {
      const error = new Error('boom');
      req.params.id = 'order1';
      req.body = { status: 'shipped' };
      orderService.updateOrderStatus.mockRejectedValue(error);

      await orderController.updateOrderStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
