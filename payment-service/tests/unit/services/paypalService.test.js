// PayPal Service Tests
const paypalService = require('../../../src/services/paypalService');
const paymentRepository = require('../../../src/repositories/paymentRepository');
const paypalClient = require('../../../src/config/paypal');

jest.mock('../../../src/repositories/paymentRepository');
jest.mock('../../../src/config/paypal');

describe('PayPal Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayPalOrder', () => {
    it('should create PayPal order successfully', async () => {
      const orderId = '507f1f77bcf86cd799439011';
      const userId = '607f1f77bcf86cd799439012';
      const amount = 99.99;
      const currency = 'USD';

      const mockPayPalOrder = {
        id: 'PAYPAL-ORDER-123',
        status: 'CREATED',
        links: [
          {
            rel: 'approve',
            href: 'https://www.paypal.com/checkoutnow?token=PAYPAL-ORDER-123',
          },
        ],
      };

      paypalClient.createOrder.mockResolvedValue(mockPayPalOrder);

      const mockPayment = {
        _id: 'payment1',
        orderId,
        userId,
        provider: 'paypal',
        paypalOrderId: 'PAYPAL-ORDER-123',
        amount: 99.99,
        currency: 'usd',
        status: 'pending',
      };

      paymentRepository.create.mockResolvedValue(mockPayment);

      const result = await paypalService.createPayPalOrder(
        orderId,
        amount,
        currency,
        userId
      );

      expect(paypalClient.createOrder).toHaveBeenCalledWith(amount, currency, {
        orderId,
        description: `Order ${orderId}`,
      });

      expect(paymentRepository.create).toHaveBeenCalledWith({
        orderId,
        userId,
        provider: 'paypal',
        paypalOrderId: 'PAYPAL-ORDER-123',
        amount: 99.99,
        currency: 'usd',
        status: 'pending',
        metadata: {},
      });

      expect(result.paypalOrderId).toBe('PAYPAL-ORDER-123');
      expect(result.approvalUrl).toBe('https://www.paypal.com/checkoutnow?token=PAYPAL-ORDER-123');
    });

    it('should throw error for invalid amount', async () => {
      await expect(
        paypalService.createPayPalOrder('orderId', 0, 'USD', 'userId')
      ).rejects.toThrow('Invalid amount');
    });

    it('should handle PayPal API errors', async () => {
      paypalClient.createOrder.mockRejectedValue(new Error('PayPal API error'));

      await expect(
        paypalService.createPayPalOrder('orderId', 99.99, 'USD', 'userId')
      ).rejects.toThrow('PayPal API error');
    });
  });

  describe('capturePayPalPayment', () => {
    it('should capture payment successfully', async () => {
      const paypalOrderId = 'PAYPAL-ORDER-123';

      const mockCaptureResult = {
        id: paypalOrderId,
        status: 'COMPLETED',
        purchaseUnits: [
          {
            payments: {
              captures: [
                {
                  id: 'CAPTURE-123',
                },
              ],
            },
          },
        ],
        payer: {
          emailAddress: 'customer@example.com',
          payerId: 'PAYER-123',
        },
      };

      paypalClient.captureOrder.mockResolvedValue(mockCaptureResult);

      const mockPayment = {
        _id: 'payment1',
        paypalOrderId,
        status: 'succeeded',
        paypalCaptureId: 'CAPTURE-123',
        paypalPayerEmail: 'customer@example.com',
        paypalPayerId: 'PAYER-123',
      };

      paymentRepository.updateByPayPalOrderId.mockResolvedValue(mockPayment);

      const result = await paypalService.capturePayPalPayment(paypalOrderId);

      expect(paypalClient.captureOrder).toHaveBeenCalledWith(paypalOrderId);
      expect(paymentRepository.updateByPayPalOrderId).toHaveBeenCalledWith(
        paypalOrderId,
        'succeeded',
        {
          paypalCaptureId: 'CAPTURE-123',
          paypalPayerEmail: 'customer@example.com',
          paypalPayerId: 'PAYER-123',
          paymentMethod: 'paypal',
        }
      );
      expect(result.status).toBe('succeeded');
    });

    it('should handle failed capture', async () => {
      const paypalOrderId = 'PAYPAL-ORDER-123';

      const mockCaptureResult = {
        id: paypalOrderId,
        status: 'FAILED',
      };

      paypalClient.captureOrder.mockResolvedValue(mockCaptureResult);

      const mockPayment = {
        _id: 'payment1',
        paypalOrderId,
        status: 'failed',
      };

      paymentRepository.updateByPayPalOrderId.mockResolvedValue(mockPayment);

      const result = await paypalService.capturePayPalPayment(paypalOrderId);

      expect(result.status).toBe('failed');
    });

    it('should handle capture errors', async () => {
      const paypalOrderId = 'PAYPAL-ORDER-123';
      paypalClient.captureOrder.mockRejectedValue(new Error('Capture failed'));
      paymentRepository.updateByPayPalOrderId.mockResolvedValue({});

      await expect(
        paypalService.capturePayPalPayment(paypalOrderId)
      ).rejects.toThrow('Capture failed');

      expect(paymentRepository.updateByPayPalOrderId).toHaveBeenCalledWith(
        paypalOrderId,
        'failed',
        { errorMessage: 'Capture failed' }
      );
    });
  });

  describe('getPayPalPaymentStatus', () => {
    it('should retrieve payment status from database', async () => {
      const paypalOrderId = 'PAYPAL-ORDER-123';

      const mockPayment = {
        _id: 'payment1',
        paypalOrderId,
        status: 'succeeded',
        amount: 99.99,
      };

      paymentRepository.findByPayPalOrderId.mockResolvedValue(mockPayment);

      const result = await paypalService.getPayPalPaymentStatus(paypalOrderId);

      expect(paymentRepository.findByPayPalOrderId).toHaveBeenCalledWith(paypalOrderId);
      expect(result.status).toBe('succeeded');
    });

    it('should return null if payment not found', async () => {
      paymentRepository.findByPayPalOrderId.mockResolvedValue(null);

      const result = await paypalService.getPayPalPaymentStatus('nonexistent');

      expect(result).toBeNull();
    });

    it('should check PayPal API for pending payments', async () => {
      const paypalOrderId = 'PAYPAL-ORDER-123';

      const mockPayment = {
        _id: 'payment1',
        paypalOrderId,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockOrderDetails = {
        id: paypalOrderId,
        status: 'APPROVED',
      };

      paymentRepository.findByPayPalOrderId.mockResolvedValue(mockPayment);
      paypalClient.getOrderDetails.mockResolvedValue(mockOrderDetails);

      const result = await paypalService.getPayPalPaymentStatus(paypalOrderId);

      expect(paypalClient.getOrderDetails).toHaveBeenCalledWith(paypalOrderId);
      expect(mockPayment.status).toBe('processing');
      expect(mockPayment.save).toHaveBeenCalled();
    });
  });

  describe('refundPayPalPayment', () => {
    it('should process full refund successfully', async () => {
      const paypalOrderId = 'PAYPAL-ORDER-123';

      const mockPayment = {
        _id: 'payment1',
        paypalOrderId,
        paypalCaptureId: 'CAPTURE-123',
        status: 'succeeded',
        amount: 99.99,
        currency: 'usd',
      };

      const mockRefundResult = {
        id: 'REFUND-123',
        status: 'COMPLETED',
      };

      paymentRepository.findByPayPalOrderId.mockResolvedValue(mockPayment);
      paypalClient.refundPayment.mockResolvedValue(mockRefundResult);

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'refunded',
        refundId: 'REFUND-123',
        refundAmount: 99.99,
      };

      paymentRepository.updateByPayPalOrderId.mockResolvedValue(mockUpdatedPayment);

      const result = await paypalService.refundPayPalPayment(paypalOrderId);

      expect(paypalClient.refundPayment).toHaveBeenCalledWith(
        'CAPTURE-123',
        99.99,
        'USD'
      );
      expect(result.status).toBe('refunded');
      expect(result.refundAmount).toBe(99.99);
    });

    it('should process partial refund successfully', async () => {
      const paypalOrderId = 'PAYPAL-ORDER-123';
      const refundAmount = 50.00;

      const mockPayment = {
        _id: 'payment1',
        paypalOrderId,
        paypalCaptureId: 'CAPTURE-123',
        status: 'succeeded',
        amount: 99.99,
        currency: 'usd',
      };

      const mockRefundResult = {
        id: 'REFUND-123',
      };

      paymentRepository.findByPayPalOrderId.mockResolvedValue(mockPayment);
      paypalClient.refundPayment.mockResolvedValue(mockRefundResult);

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'refunded',
        refundAmount: 50.00,
      };

      paymentRepository.updateByPayPalOrderId.mockResolvedValue(mockUpdatedPayment);

      const result = await paypalService.refundPayPalPayment(paypalOrderId, refundAmount);

      expect(result.refundAmount).toBe(50.00);
    });

    it('should throw error if payment not found', async () => {
      paymentRepository.findByPayPalOrderId.mockResolvedValue(null);

      await expect(
        paypalService.refundPayPalPayment('nonexistent')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error if payment not succeeded', async () => {
      const mockPayment = {
        paypalOrderId: 'PAYPAL-ORDER-123',
        status: 'pending',
      };

      paymentRepository.findByPayPalOrderId.mockResolvedValue(mockPayment);

      await expect(
        paypalService.refundPayPalPayment('PAYPAL-ORDER-123')
      ).rejects.toThrow('Can only refund successful payments');
    });

    it('should throw error if no capture ID', async () => {
      const mockPayment = {
        paypalOrderId: 'PAYPAL-ORDER-123',
        status: 'succeeded',
        paypalCaptureId: null,
      };

      paymentRepository.findByPayPalOrderId.mockResolvedValue(mockPayment);

      await expect(
        paypalService.refundPayPalPayment('PAYPAL-ORDER-123')
      ).rejects.toThrow('No capture ID found for this payment');
    });

    it('should throw error if refund amount exceeds payment amount', async () => {
      const mockPayment = {
        paypalOrderId: 'PAYPAL-ORDER-123',
        paypalCaptureId: 'CAPTURE-123',
        status: 'succeeded',
        amount: 99.99,
      };

      paymentRepository.findByPayPalOrderId.mockResolvedValue(mockPayment);

      await expect(
        paypalService.refundPayPalPayment('PAYPAL-ORDER-123', 150.00)
      ).rejects.toThrow('Refund amount cannot exceed payment amount');
    });
  });

  describe('cancelPayPalOrder', () => {
    it('should cancel order successfully', async () => {
      const paypalOrderId = 'PAYPAL-ORDER-123';

      const mockPayment = {
        _id: 'payment1',
        paypalOrderId,
        status: 'canceled',
      };

      paymentRepository.updateByPayPalOrderId.mockResolvedValue(mockPayment);

      const result = await paypalService.cancelPayPalOrder(paypalOrderId);

      expect(paymentRepository.updateByPayPalOrderId).toHaveBeenCalledWith(
        paypalOrderId,
        'canceled'
      );
      expect(result.status).toBe('canceled');
    });
  });

  describe('getPayPalPaymentByOrderId', () => {
    it('should retrieve PayPal payment by order ID', async () => {
      const orderId = '507f1f77bcf86cd799439011';

      const mockPayment = {
        _id: 'payment1',
        orderId,
        provider: 'paypal',
        paypalOrderId: 'PAYPAL-ORDER-123',
      };

      paymentRepository.findByOrderId.mockResolvedValue(mockPayment);

      const result = await paypalService.getPayPalPaymentByOrderId(orderId);

      expect(paymentRepository.findByOrderId).toHaveBeenCalledWith(orderId, 'paypal');
      expect(result.provider).toBe('paypal');
    });
  });
});
