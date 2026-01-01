// M-Pesa Service Tests
const mpesaService = require('../src/services/mpesaService');
const paymentRepository = require('../src/repositories/paymentRepository');
const mpesaClient = require('../src/config/mpesa');

jest.mock('../src/repositories/paymentRepository');
jest.mock('../src/config/mpesa');

describe('M-Pesa Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePhoneNumber', () => {
    it('should validate and format 254XXXXXXXXX format', () => {
      const result = mpesaService.validatePhoneNumber('254712345678');
      expect(result).toBe('254712345678');
    });

    it('should convert 0XXXXXXXXX to 254XXXXXXXXX', () => {
      const result = mpesaService.validatePhoneNumber('0712345678');
      expect(result).toBe('254712345678');
    });

    it('should convert XXXXXXXXX to 254XXXXXXXXX', () => {
      const result = mpesaService.validatePhoneNumber('712345678');
      expect(result).toBe('254712345678');
    });

    it('should handle phone numbers with spaces', () => {
      const result = mpesaService.validatePhoneNumber('0712 345 678');
      expect(result).toBe('254712345678');
    });

    it('should throw error for invalid phone numbers', () => {
      expect(() => mpesaService.validatePhoneNumber('123')).toThrow('Invalid phone number format');
    });
  });

  describe('initiateMpesaPayment', () => {
    it('should initiate M-Pesa payment successfully', async () => {
      const orderId = '507f1f77bcf86cd799439011';
      const userId = '607f1f77bcf86cd799439012';
      const amount = 1000;
      const phoneNumber = '0712345678';

      const mockMpesaResponse = {
        MerchantRequestID: 'merchant-123',
        CheckoutRequestID: 'checkout-456',
        ResponseCode: '0',
        ResponseDescription: 'Success',
        CustomerMessage: 'Success. Request accepted for processing',
      };

      mpesaClient.stkPush.mockResolvedValue(mockMpesaResponse);

      const mockPayment = {
        _id: 'payment1',
        orderId,
        userId,
        provider: 'mpesa',
        mpesaCheckoutRequestId: 'checkout-456',
        phoneNumber: '254712345678',
        amount: 1000,
        currency: 'kes',
        status: 'pending',
      };

      paymentRepository.create.mockResolvedValue(mockPayment);

      const result = await mpesaService.initiateMpesaPayment(
        orderId,
        amount,
        phoneNumber,
        userId
      );

      expect(mpesaClient.stkPush).toHaveBeenCalledWith(
        '254712345678',
        amount,
        orderId,
        `Payment for order ${orderId}`
      );

      expect(paymentRepository.create).toHaveBeenCalledWith({
        orderId,
        userId,
        provider: 'mpesa',
        mpesaCheckoutRequestId: 'checkout-456',
        phoneNumber: '254712345678',
        amount: 1000,
        currency: 'kes',
        status: 'pending',
        metadata: {},
      });

      expect(result.checkoutRequestId).toBe('checkout-456');
      expect(result.responseCode).toBe('0');
    });

    it('should throw error for invalid amount', async () => {
      await expect(
        mpesaService.initiateMpesaPayment('orderId', 0, '0712345678', 'userId')
      ).rejects.toThrow('Invalid amount');
    });

    it('should throw error for missing phone number', async () => {
      await expect(
        mpesaService.initiateMpesaPayment('orderId', 1000, '', 'userId')
      ).rejects.toThrow('Phone number is required');
    });

    it('should handle M-Pesa API errors', async () => {
      mpesaClient.stkPush.mockResolvedValue({
        ResponseCode: '1',
        ResponseDescription: 'Invalid phone number',
      });

      await expect(
        mpesaService.initiateMpesaPayment('orderId', 1000, '0712345678', 'userId')
      ).rejects.toThrow('Invalid phone number');
    });
  });

  describe('queryMpesaPayment', () => {
    it('should query successful payment', async () => {
      const checkoutRequestId = 'checkout-456';

      const mockMpesaResponse = {
        ResultCode: '0',
        ResultDesc: 'The service request is processed successfully',
        CheckoutRequestID: checkoutRequestId,
      };

      mpesaClient.stkPushQuery.mockResolvedValue(mockMpesaResponse);

      const mockPayment = {
        _id: 'payment1',
        mpesaCheckoutRequestId: checkoutRequestId,
        status: 'pending',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'succeeded',
        mpesaTransactionId: checkoutRequestId,
        paymentMethod: 'mpesa',
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);
      paymentRepository.updateByCheckoutId.mockResolvedValue(mockUpdatedPayment);

      const result = await mpesaService.queryMpesaPayment(checkoutRequestId);

      expect(mpesaClient.stkPushQuery).toHaveBeenCalledWith(checkoutRequestId);
      expect(result.status).toBe('succeeded');
    });

    it('should handle failed payment', async () => {
      const checkoutRequestId = 'checkout-456';

      const mockMpesaResponse = {
        ResultCode: '1',
        ResultDesc: 'Insufficient balance',
        CheckoutRequestID: checkoutRequestId,
      };

      mpesaClient.stkPushQuery.mockResolvedValue(mockMpesaResponse);

      const mockPayment = {
        _id: 'payment1',
        mpesaCheckoutRequestId: checkoutRequestId,
        status: 'pending',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'failed',
        errorMessage: 'Insufficient balance',
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);
      paymentRepository.updateByCheckoutId.mockResolvedValue(mockUpdatedPayment);

      const result = await mpesaService.queryMpesaPayment(checkoutRequestId);

      expect(result.status).toBe('failed');
    });

    it('should handle cancelled payment', async () => {
      const checkoutRequestId = 'checkout-456';

      const mockMpesaResponse = {
        ResultCode: '1032',
        ResultDesc: 'Request cancelled by user',
        CheckoutRequestID: checkoutRequestId,
      };

      mpesaClient.stkPushQuery.mockResolvedValue(mockMpesaResponse);

      const mockPayment = {
        _id: 'payment1',
        mpesaCheckoutRequestId: checkoutRequestId,
        status: 'pending',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'canceled',
        errorMessage: 'Request cancelled by user',
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);
      paymentRepository.updateByCheckoutId.mockResolvedValue(mockUpdatedPayment);

      const result = await mpesaService.queryMpesaPayment(checkoutRequestId);

      expect(result.status).toBe('canceled');
    });

    it('should throw error if payment not found', async () => {
      mpesaClient.stkPushQuery.mockResolvedValue({
        ResultCode: '0',
        CheckoutRequestID: 'nonexistent',
      });
      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(null);

      await expect(
        mpesaService.queryMpesaPayment('nonexistent')
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('handleMpesaCallback', () => {
    it('should handle successful payment callback', async () => {
      const callbackData = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-123',
            CheckoutRequestID: 'checkout-456',
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 1000 },
                { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
                { Name: 'PhoneNumber', Value: '254712345678' },
              ],
            },
          },
        },
      };

      const mockPayment = {
        _id: 'payment1',
        mpesaCheckoutRequestId: 'checkout-456',
        status: 'pending',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'succeeded',
        mpesaTransactionId: 'NLJ7RT61SV',
        mpesaReceiptNumber: 'NLJ7RT61SV',
        paymentMethod: 'mpesa',
        phoneNumber: '254712345678',
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);
      paymentRepository.updateByCheckoutId.mockResolvedValue(mockUpdatedPayment);

      const result = await mpesaService.handleMpesaCallback(callbackData);

      expect(paymentRepository.findByMpesaCheckoutId).toHaveBeenCalledWith('checkout-456');
      expect(result.status).toBe('succeeded');
      expect(result.mpesaReceiptNumber).toBe('NLJ7RT61SV');
    });

    it('should handle failed payment callback', async () => {
      const callbackData = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-123',
            CheckoutRequestID: 'checkout-456',
            ResultCode: 1,
            ResultDesc: 'Insufficient balance',
          },
        },
      };

      const mockPayment = {
        _id: 'payment1',
        mpesaCheckoutRequestId: 'checkout-456',
        status: 'pending',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'failed',
        errorMessage: 'Insufficient balance',
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);
      paymentRepository.updateByCheckoutId.mockResolvedValue(mockUpdatedPayment);

      const result = await mpesaService.handleMpesaCallback(callbackData);

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Insufficient balance');
    });

    it('should handle cancelled payment callback', async () => {
      const callbackData = {
        Body: {
          stkCallback: {
            CheckoutRequestID: 'checkout-456',
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user',
          },
        },
      };

      const mockPayment = {
        _id: 'payment1',
        mpesaCheckoutRequestId: 'checkout-456',
        status: 'pending',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'canceled',
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);
      paymentRepository.updateByCheckoutId.mockResolvedValue(mockUpdatedPayment);

      const result = await mpesaService.handleMpesaCallback(callbackData);

      expect(result.status).toBe('canceled');
    });
  });

  describe('refundMpesaPayment', () => {
    it('should process refund successfully', async () => {
      const checkoutRequestId = 'checkout-456';
      const refundAmount = 500;

      const mockPayment = {
        _id: 'payment1',
        mpesaCheckoutRequestId: checkoutRequestId,
        status: 'succeeded',
        amount: 1000,
        phoneNumber: '254712345678',
        mpesaReceiptNumber: 'NLJ7RT61SV',
      };

      const mockB2CResponse = {
        ConversationID: 'conv-123',
        OriginatorConversationID: 'orig-456',
        ResponseCode: '0',
        ResponseDescription: 'Accept the service request successfully',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'refunded',
        refundId: 'conv-123',
        refundAmount: 500,
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);
      mpesaClient.b2cPayment.mockResolvedValue(mockB2CResponse);
      paymentRepository.updateByCheckoutId.mockResolvedValue(mockUpdatedPayment);

      const result = await mpesaService.refundMpesaPayment(checkoutRequestId, refundAmount);

      expect(mpesaClient.b2cPayment).toHaveBeenCalledWith(
        '254712345678',
        refundAmount,
        expect.stringContaining('Refund')
      );
      expect(result.status).toBe('refunded');
      expect(result.refundAmount).toBe(500);
    });

    it('should refund full amount if not specified', async () => {
      const checkoutRequestId = 'checkout-456';

      const mockPayment = {
        _id: 'payment1',
        mpesaCheckoutRequestId: checkoutRequestId,
        status: 'succeeded',
        amount: 1000,
        phoneNumber: '254712345678',
      };

      const mockB2CResponse = {
        ConversationID: 'conv-123',
        ResponseCode: '0',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'refunded',
        refundAmount: 1000,
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);
      mpesaClient.b2cPayment.mockResolvedValue(mockB2CResponse);
      paymentRepository.updateByCheckoutId.mockResolvedValue(mockUpdatedPayment);

      const result = await mpesaService.refundMpesaPayment(checkoutRequestId);

      expect(result.refundAmount).toBe(1000);
    });

    it('should throw error if payment not found', async () => {
      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(null);

      await expect(
        mpesaService.refundMpesaPayment('nonexistent')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error if payment not succeeded', async () => {
      const mockPayment = {
        mpesaCheckoutRequestId: 'checkout-456',
        status: 'pending',
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);

      await expect(
        mpesaService.refundMpesaPayment('checkout-456')
      ).rejects.toThrow('Can only refund successful payments');
    });

    it('should throw error if refund amount exceeds payment amount', async () => {
      const mockPayment = {
        mpesaCheckoutRequestId: 'checkout-456',
        status: 'succeeded',
        amount: 1000,
      };

      paymentRepository.findByMpesaCheckoutId.mockResolvedValue(mockPayment);

      await expect(
        mpesaService.refundMpesaPayment('checkout-456', 1500)
      ).rejects.toThrow('Refund amount cannot exceed payment amount');
    });
  });
});
