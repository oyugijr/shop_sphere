const orderController = require('../../../src/controllers/orderController');
const orderService = require('../../../src/services/orderService');

jest.mock('../../../src/services/orderService');

describe('Order Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: '507f1f77bcf86cd799439011' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const orderData = {
        products: [{ product: 'prod1', quantity: 2 }],
        totalPrice: 199.98
      };
      const mockOrder = {
        _id: 'order1',
        user: req.user.id,
        ...orderData,
        status: 'pending'
      };

      req.body = orderData;
      orderService.createOrder.mockResolvedValue(mockOrder);

      await orderController.createOrder(req, res);

      expect(orderService.createOrder).toHaveBeenCalledWith(
        req.user.id,
        orderData.products,
        orderData.totalPrice
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    it('should handle errors', async () => {
      req.body = { products: [], totalPrice: 0 };
      orderService.createOrder.mockRejectedValue(new Error('Database error'));

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('getOrderById', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        _id: 'order1',
        user: req.user.id,
        products: [],
        totalPrice: 199.98,
        status: 'pending'
      };

      req.params.id = 'order1';
      orderService.getOrderById.mockResolvedValue(mockOrder);

      await orderController.getOrderById(req, res);

      expect(orderService.getOrderById).toHaveBeenCalledWith('order1');
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    it('should return 404 if order not found', async () => {
      req.params.id = 'nonexistent';
      orderService.getOrderById.mockResolvedValue(null);

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
    });

    it('should handle errors', async () => {
      req.params.id = 'order1';
      orderService.getOrderById.mockRejectedValue(new Error('Database error'));

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('getUserOrders', () => {
    it('should return all orders for a user', async () => {
      const mockOrders = [
        { _id: 'order1', user: req.user.id, totalPrice: 99.99, status: 'pending' },
        { _id: 'order2', user: req.user.id, totalPrice: 199.98, status: 'delivered' }
      ];

      orderService.getUserOrders.mockResolvedValue(mockOrders);

      await orderController.getUserOrders(req, res);

      expect(orderService.getUserOrders).toHaveBeenCalledWith(req.user.id);
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should handle errors', async () => {
      orderService.getUserOrders.mockRejectedValue(new Error('Database error'));

      await orderController.getUserOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        _id: 'order1',
        user: req.user.id,
        totalPrice: 99.99,
        status: 'shipped'
      };

      req.params.id = 'order1';
      req.body = { status: 'shipped' };
      orderService.updateOrderStatus.mockResolvedValue(mockOrder);

      await orderController.updateOrderStatus(req, res);

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order1', 'shipped');
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    it('should handle errors', async () => {
      req.params.id = 'order1';
      req.body = { status: 'shipped' };
      orderService.updateOrderStatus.mockRejectedValue(new Error('Database error'));

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });
});
