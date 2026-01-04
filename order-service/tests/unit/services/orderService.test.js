const orderService = require('../../../src/services/orderService');
const orderRepository = require('../../../src/repositories/orderRepository');

jest.mock('../../../src/repositories/orderRepository');

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const products = [
        { product: '507f1f77bcf86cd799439012', quantity: 2 }
      ];
      const totalPrice = 1999.98;

      const mockOrder = {
        _id: '507f1f77bcf86cd799439013',
        user: userId,
        products,
        totalPrice,
        status: 'pending'
      };

      orderRepository.createOrder.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(userId, products, totalPrice);

      expect(orderRepository.createOrder).toHaveBeenCalledWith({
        user: userId,
        products,
        totalPrice
      });
      expect(result).toEqual(mockOrder);
    });

    it('should propagate repository errors', async () => {
      orderRepository.createOrder.mockRejectedValue(new Error('Database error'));

      await expect(
        orderService.createOrder('userId', [], 0)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getOrderById', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        _id: '507f1f77bcf86cd799439013',
        user: { _id: '507f1f77bcf86cd799439011', name: 'John Doe' },
        products: [{ product: { name: 'Laptop' }, quantity: 1 }],
        totalPrice: 999.99,
        status: 'pending'
      };

      orderRepository.getOrderById.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('507f1f77bcf86cd799439013');

      expect(orderRepository.getOrderById).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(result).toEqual(mockOrder);
    });

    it('should return null if order not found', async () => {
      orderRepository.getOrderById.mockResolvedValue(null);

      const result = await orderService.getOrderById('nonexistent');

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      orderRepository.getOrderById.mockRejectedValue(new Error('Database error'));

      await expect(orderService.getOrderById('orderId')).rejects.toThrow('Database error');
    });
  });

  describe('getUserOrders', () => {
    it('should return all orders for a user', async () => {
      const mockOrders = [
        {
          _id: '507f1f77bcf86cd799439013',
          user: '507f1f77bcf86cd799439011',
          products: [],
          totalPrice: 999.99,
          status: 'pending'
        },
        {
          _id: '507f1f77bcf86cd799439014',
          user: '507f1f77bcf86cd799439011',
          products: [],
          totalPrice: 499.99,
          status: 'delivered'
        }
      ];

      orderRepository.getUserOrders.mockResolvedValue(mockOrders);

      const result = await orderService.getUserOrders('507f1f77bcf86cd799439011');

      expect(orderRepository.getUserOrders).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockOrders);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if user has no orders', async () => {
      orderRepository.getUserOrders.mockResolvedValue([]);

      const result = await orderService.getUserOrders('userId');

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      orderRepository.getUserOrders.mockRejectedValue(new Error('Database error'));

      await expect(orderService.getUserOrders('userId')).rejects.toThrow('Database error');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockUpdatedOrder = {
        _id: '507f1f77bcf86cd799439013',
        user: '507f1f77bcf86cd799439011',
        products: [],
        totalPrice: 999.99,
        status: 'shipped'
      };

      orderRepository.updateOrderStatus.mockResolvedValue(mockUpdatedOrder);

      const result = await orderService.updateOrderStatus('507f1f77bcf86cd799439013', 'shipped');

      expect(orderRepository.updateOrderStatus).toHaveBeenCalledWith('507f1f77bcf86cd799439013', 'shipped');
      expect(result.status).toBe('shipped');
    });

    it('should return null if order not found', async () => {
      orderRepository.updateOrderStatus.mockResolvedValue(null);

      const result = await orderService.updateOrderStatus('nonexistent', 'shipped');

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      orderRepository.updateOrderStatus.mockRejectedValue(new Error('Database error'));

      await expect(
        orderService.updateOrderStatus('orderId', 'shipped')
      ).rejects.toThrow('Database error');
    });
  });
});
