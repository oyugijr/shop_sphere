const orderService = require('../../../src/services/orderService');
const orderRepository = require('../../../src/repositories/orderRepository');

jest.mock('../../../src/repositories/orderRepository');
jest.mock('../../../src/utils/serviceClients', () => ({
  verifyProductStock: jest.fn(),
}));

const { verifyProductStock } = require('../../../src/utils/serviceClients');

const buildOrderPayload = () => ({
  items: [
    {
      productId: '507f1f77bcf86cd799439012',
      quantity: 2,
      price: 999.99,
      name: 'Gaming Laptop',
    },
  ],
  totalPrice: 1999.98,
  shippingAddress: {
    fullName: 'John Doe',
    phoneNumber: '+1234567890',
    street: '123 Main St',
    city: 'Nairobi',
    state: 'Nairobi',
    zipCode: '00100',
    country: 'Kenya',
  },
  notes: 'Deliver between 9am-5pm',
  paymentMethod: 'stripe',
});

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const orderPayload = buildOrderPayload();
      const mockOrder = { _id: 'order-1', orderNumber: 'ORD-001' };

      verifyProductStock.mockResolvedValue([
        { stock: 10, name: 'Gaming Laptop', price: 999.99 },
      ]);
      orderRepository.createOrder.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(userId, orderPayload, 'Bearer token');

      expect(verifyProductStock).toHaveBeenCalledWith(orderPayload.items, 'Bearer token');
      expect(orderRepository.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          totalPrice: 1999.98,
          paymentMethod: 'stripe',
          items: expect.arrayContaining([
            expect.objectContaining({
              product: '507f1f77bcf86cd799439012',
              quantity: 2,
              price: 999.99,
              subtotal: 1999.98,
            }),
          ]),
        })
      );
      expect(result).toBe(mockOrder);
    });

    it('should propagate repository errors', async () => {
      const orderPayload = buildOrderPayload();
      verifyProductStock.mockResolvedValue([{ stock: 5, price: 999.99, name: 'Gaming Laptop' }]);
      orderRepository.createOrder.mockRejectedValue(new Error('Database error'));

      await expect(
        orderService.createOrder('userId', orderPayload, 'token')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getOrderById', () => {
    it('should return an order when requester owns it', async () => {
      const mockOrder = {
        _id: 'order-1',
        user: { _id: '507f1f77bcf86cd799439011' },
      };
      orderRepository.getOrderById.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1', '507f1f77bcf86cd799439011', false);

      expect(orderRepository.getOrderById).toHaveBeenCalledWith('order-1');
      expect(result).toBe(mockOrder);
    });

    it('should throw when order not found', async () => {
      orderRepository.getOrderById.mockResolvedValue(null);

      await expect(
        orderService.getOrderById('missing', 'user', false)
      ).rejects.toThrow('Order not found');
    });

    it('should prevent access for non-owners', async () => {
      const mockOrder = {
        _id: 'order-1',
        user: { _id: 'owner-id' },
      };
      orderRepository.getOrderById.mockResolvedValue(mockOrder);

      await expect(
        orderService.getOrderById('order-1', 'other-user', false)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('getUserOrders', () => {
    it('should pass pagination options to repository', async () => {
      const mockResponse = {
        orders: [{ _id: 'order-1' }],
        pagination: { page: 1, total: 1 },
      };
      const options = { page: 2, limit: 5, status: 'pending' };
      orderRepository.getUserOrders.mockResolvedValue(mockResponse);

      const result = await orderService.getUserOrders('user-1', options);

      expect(orderRepository.getUserOrders).toHaveBeenCalledWith('user-1', options);
      expect(result).toBe(mockResponse);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update status when repository returns order', async () => {
      const mockOrder = { _id: 'order-1', status: 'shipped' };
      orderRepository.updateOrderStatus.mockResolvedValue(mockOrder);

      const result = await orderService.updateOrderStatus('order-1', 'shipped', 'user-1', 'note');

      expect(orderRepository.updateOrderStatus).toHaveBeenCalledWith('order-1', 'shipped', 'user-1', 'note');
      expect(result).toBe(mockOrder);
    });

    it('should throw when repository returns null', async () => {
      orderRepository.updateOrderStatus.mockResolvedValue(null);

      await expect(
        orderService.updateOrderStatus('order-1', 'shipped', 'user-1')
      ).rejects.toThrow('Order not found');
    });
  });
});
