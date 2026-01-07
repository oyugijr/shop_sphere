// Payment Service Tests
const paymentService = require('../../../src/services/paymentService');
const paymentRepository = require('../../../src/repositories/paymentRepository');
const stripe = require('stripe');

jest.mock('../../../src/repositories/paymentRepository');
jest.mock('../../../src/config/stripe', () => ({
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
}));

// Mock Keverd service
jest.mock('../../../src/services/keverdService', () => ({
  assessFraudRisk: jest.fn(),
  shouldBlockTransaction: jest.fn(),
  shouldChallengeTransaction: jest.fn(),
  formatFraudDataForResponse: jest.fn(),
}));

const mockStripe = require('../../../src/config/stripe');
const keverdService = require('../../../src/services/keverdService');

describe('Payment Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const orderId = '507f1f77bcf86cd799439011';
      const userId = '607f1f77bcf86cd799439012';
      const amount = 9999; // $99.99 in cents
      const currency = 'usd';

      // Mock fraud detection as disabled for this test
      keverdService.assessFraudRisk.mockResolvedValue({
        enabled: false,
        riskScore: 0,
        action: 'allow',
        reasons: ['fraud_detection_disabled'],
        sessionId: null,
        requestId: null,
      });
      keverdService.shouldBlockTransaction.mockReturnValue(false);
      keverdService.formatFraudDataForResponse.mockReturnValue({
        fraudCheckEnabled: false,
      });

      const mockIntent = {
        id: 'pi_123456',
        amount,
        currency,
        status: 'requires_payment_method',
        client_secret: 'pi_123456_secret'
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockIntent);

      const mockPayment = {
        _id: 'payment1',
        orderId,
        userId,
        stripePaymentIntentId: 'pi_123456',
        amount: 99.99,
        currency,
        status: 'pending'
      };

      paymentRepository.create.mockResolvedValue(mockPayment);

      const result = await paymentService.createPaymentIntent(orderId, amount, currency, userId);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount,
        currency,
        metadata: { orderId, userId },
        automatic_payment_methods: { enabled: true }
      });
      expect(paymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId,
          userId,
          stripePaymentIntentId: 'pi_123456',
          amount: 99.99,
          currency,
          status: 'pending',
          metadata: {},
          fraudDetection: expect.any(Object),
        })
      );
      expect(result.client_secret).toBe('pi_123456_secret');
      expect(result.fraudCheck).toBeDefined();
    });

    it('should handle stripe errors', async () => {
      // Mock fraud detection
      keverdService.assessFraudRisk.mockResolvedValue({
        enabled: false,
        riskScore: 0,
        action: 'allow',
        reasons: ['fraud_detection_disabled'],
      });
      keverdService.shouldBlockTransaction.mockReturnValue(false);

      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        paymentService.createPaymentIntent('orderId', 1000, 'usd', 'userId')
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('confirmPayment', () => {
    it('should confirm a payment', async () => {
      const paymentIntentId = 'pi_123456';

      const mockIntent = {
        id: paymentIntentId,
        amount: 9999,
        currency: 'usd',
        status: 'succeeded'
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockIntent);

      const mockPayment = {
        _id: 'payment1',
        stripePaymentIntentId: paymentIntentId,
        status: 'succeeded'
      };

      paymentRepository.updateStatus.mockResolvedValue(mockPayment);

      const result = await paymentService.confirmPayment(paymentIntentId);

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(paymentIntentId);
      expect(paymentRepository.updateStatus).toHaveBeenCalledWith(paymentIntentId, 'succeeded');
      expect(result.status).toBe('succeeded');
    });

    it('should handle payment failure', async () => {
      const paymentIntentId = 'pi_123456';

      const mockIntent = {
        id: paymentIntentId,
        status: 'requires_payment_method'
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockIntent);

      const mockPayment = {
        _id: 'payment1',
        stripePaymentIntentId: paymentIntentId,
        status: 'failed'
      };

      paymentRepository.updateStatus.mockResolvedValue(mockPayment);

      const result = await paymentService.confirmPayment(paymentIntentId);

      expect(result.status).toBe('failed');
    });
  });

  describe('getPaymentStatus', () => {
    it('should retrieve payment status', async () => {
      const paymentIntentId = 'pi_123456';

      const mockPayment = {
        _id: 'payment1',
        stripePaymentIntentId: paymentIntentId,
        amount: 99.99,
        status: 'succeeded'
      };

      paymentRepository.findByStripeId.mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentStatus(paymentIntentId);

      expect(paymentRepository.findByStripeId).toHaveBeenCalledWith(paymentIntentId);
      expect(result.status).toBe('succeeded');
    });

    it('should return null if payment not found', async () => {
      paymentRepository.findByStripeId.mockResolvedValue(null);

      const result = await paymentService.getPaymentStatus('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('refundPayment', () => {
    it('should process a refund', async () => {
      const paymentIntentId = 'pi_123456';
      const amount = 9999;

      const mockRefund = {
        id: 're_123456',
        amount,
        status: 'succeeded'
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        latest_charge: 'ch_123456'
      });

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const mockPayment = {
        _id: 'payment1',
        stripePaymentIntentId: paymentIntentId,
        status: 'refunded',
        refundId: 're_123456'
      };

      paymentRepository.addRefund.mockResolvedValue(mockPayment);

      const result = await paymentService.refundPayment(paymentIntentId, amount);

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(paymentIntentId);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        charge: 'ch_123456',
        amount
      });
      expect(paymentRepository.addRefund).toHaveBeenCalledWith(paymentIntentId, 're_123456', 99.99);
      expect(result.status).toBe('refunded');
    });

    it('should handle refund errors', async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValue(new Error('Refund failed'));

      await expect(
        paymentService.refundPayment('pi_123456', 1000)
      ).rejects.toThrow('Refund failed');
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            status: 'succeeded',
            payment_method: 'pm_123456'
          }
        }
      };

      const mockPayment = {
        _id: 'payment1',
        stripePaymentIntentId: 'pi_123456',
        status: 'succeeded'
      };

      paymentRepository.updateStatus.mockResolvedValue(mockPayment);

      const result = await paymentService.handleWebhook(event);

      expect(paymentRepository.updateStatus).toHaveBeenCalledWith('pi_123456', 'succeeded', {
        paymentMethod: 'pm_123456'
      });
      expect(result.status).toBe('succeeded');
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123456',
            status: 'failed'
          }
        }
      };

      const mockPayment = {
        _id: 'payment1',
        stripePaymentIntentId: 'pi_123456',
        status: 'failed'
      };

      paymentRepository.updateStatus.mockResolvedValue(mockPayment);

      const result = await paymentService.handleWebhook(event);

      expect(result.status).toBe('failed');
    });

    it('should ignore unhandled webhook events', async () => {
      const event = {
        type: 'customer.created',
        data: {}
      };

      const result = await paymentService.handleWebhook(event);

      expect(result).toBeNull();
      expect(paymentRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});
