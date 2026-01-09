const paymentService = require('../../../src/services/paymentService');
const keverdService = require('../../../src/services/keverdService');
const paymentRepository = require('../../../src/repositories/paymentRepository');

// Mock Keverd service
jest.mock('../../../src/services/keverdService');

// Mock Stripe
jest.mock('../../../src/config/stripe', () => ({
    paymentIntents: {
        create: jest.fn(),
    },
}));

const stripe = require('../../../src/config/stripe');

// Mock payment repository
jest.mock('../../../src/repositories/paymentRepository', () => ({
    create: jest.fn(),
}));

describe('Payment Service with Fraud Detection', () => {
    const mockTransactionData = {
        orderId: 'order-123',
        userId: 'user-456',
        amount: 10000, // $100 in cents
        currency: 'usd',
        metadata: {},
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createPaymentIntent with fraud detection', () => {
        it('should create payment intent when fraud risk is low', async () => {
            // Mock low-risk fraud assessment
            keverdService.assessFraudRisk.mockResolvedValue({
                enabled: true,
                riskScore: 20,
                action: 'allow',
                reasons: ['low_risk'],
                sessionId: 'session-123',
                requestId: 'request-456',
                checkedAt: new Date(),
            });

            keverdService.shouldBlockTransaction.mockReturnValue(false);
            keverdService.shouldChallengeTransaction.mockReturnValue(false);
            keverdService.formatFraudDataForResponse.mockReturnValue({
                fraudCheckEnabled: true,
                riskScore: 20,
                riskLevel: 'minimal',
                action: 'allow',
                reasons: ['low_risk'],
                sessionId: 'session-123',
            });

            // Mock Stripe response
            stripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_test_123',
                client_secret: 'pi_test_123_secret',
                status: 'requires_payment_method',
            });

            // Mock repository response
            paymentRepository.create.mockResolvedValue({
                _id: 'payment-123',
                orderId: mockTransactionData.orderId,
                userId: mockTransactionData.userId,
                stripePaymentIntentId: 'pi_test_123',
                amount: 100,
                currency: 'usd',
                status: 'pending',
                fraudDetection: {
                    enabled: true,
                    riskScore: 20,
                    action: 'allow',
                    reasons: ['low_risk'],
                    sessionId: 'session-123',
                    requestId: 'request-456',
                },
            });

            const result = await paymentService.createPaymentIntent(
                mockTransactionData.orderId,
                mockTransactionData.amount,
                mockTransactionData.currency,
                mockTransactionData.userId,
                mockTransactionData.metadata
            );

            // Verify fraud detection was called
            expect(keverdService.assessFraudRisk).toHaveBeenCalledWith(
                {
                    orderId: mockTransactionData.orderId,
                    userId: mockTransactionData.userId,
                    amount: 100, // Converted to dollars
                    currency: mockTransactionData.currency,
                    metadata: mockTransactionData.metadata,
                },
                expect.any(Object)
            );

            // Verify Stripe was called
            expect(stripe.paymentIntents.create).toHaveBeenCalled();

            // Verify payment was saved with fraud data
            expect(paymentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    fraudDetection: expect.objectContaining({
                        enabled: true,
                        riskScore: 20,
                        action: 'allow',
                    }),
                })
            );

            // Verify result includes fraud check data
            expect(result.fraudCheck).toBeDefined();
            expect(result.fraudCheck.fraudCheckEnabled).toBe(true);
            expect(result.fraudCheck.riskScore).toBe(20);
        });

        it('should block payment when fraud risk is high', async () => {
            // Mock high-risk fraud assessment
            keverdService.assessFraudRisk.mockResolvedValue({
                enabled: true,
                riskScore: 85,
                action: 'block',
                reasons: ['suspicious_activity', 'high_velocity'],
                sessionId: 'session-789',
                requestId: 'request-012',
                checkedAt: new Date(),
            });

            keverdService.shouldBlockTransaction.mockReturnValue(true);

            // Mock repository response for blocked transaction
            paymentRepository.create.mockResolvedValue({
                _id: 'payment-blocked',
                orderId: mockTransactionData.orderId,
                userId: mockTransactionData.userId,
                status: 'failed',
                fraudDetection: {
                    enabled: true,
                    riskScore: 85,
                    action: 'block',
                    reasons: ['suspicious_activity', 'high_velocity'],
                    sessionId: 'session-789',
                    requestId: 'request-012',
                },
                errorMessage: 'Transaction blocked due to high fraud risk (score: 85)',
            });

            await expect(
                paymentService.createPaymentIntent(
                    mockTransactionData.orderId,
                    mockTransactionData.amount,
                    mockTransactionData.currency,
                    mockTransactionData.userId,
                    mockTransactionData.metadata
                )
            ).rejects.toThrow('Transaction blocked due to high fraud risk');

            // Verify fraud detection was called
            expect(keverdService.assessFraudRisk).toHaveBeenCalled();
            expect(keverdService.shouldBlockTransaction).toHaveBeenCalledWith(85);

            // Verify Stripe was NOT called
            expect(stripe.paymentIntents.create).not.toHaveBeenCalled();

            // Verify payment was saved with failed status and fraud data
            expect(paymentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'failed',
                    fraudDetection: expect.objectContaining({
                        enabled: true,
                        riskScore: 85,
                        action: 'block',
                    }),
                    errorMessage: expect.stringContaining('high fraud risk'),
                })
            );
        });

        it('should allow and log medium-risk transactions', async () => {
            // Mock medium-risk fraud assessment
            keverdService.assessFraudRisk.mockResolvedValue({
                enabled: true,
                riskScore: 60,
                action: 'soft_challenge',
                reasons: ['new_device'],
                sessionId: 'session-medium',
                requestId: 'request-medium',
                checkedAt: new Date(),
            });

            keverdService.shouldBlockTransaction.mockReturnValue(false);
            keverdService.shouldChallengeTransaction.mockReturnValue(true);
            keverdService.formatFraudDataForResponse.mockReturnValue({
                fraudCheckEnabled: true,
                riskScore: 60,
                riskLevel: 'medium',
                action: 'soft_challenge',
                reasons: ['new_device'],
                sessionId: 'session-medium',
            });

            // Mock Stripe response
            stripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_test_medium',
                client_secret: 'pi_test_medium_secret',
                status: 'requires_payment_method',
            });

            // Mock repository response
            paymentRepository.create.mockResolvedValue({
                _id: 'payment-medium',
                orderId: mockTransactionData.orderId,
                userId: mockTransactionData.userId,
                stripePaymentIntentId: 'pi_test_medium',
                amount: 100,
                currency: 'usd',
                status: 'pending',
                fraudDetection: {
                    enabled: true,
                    riskScore: 60,
                    action: 'soft_challenge',
                    reasons: ['new_device'],
                    sessionId: 'session-medium',
                },
            });

            const result = await paymentService.createPaymentIntent(
                mockTransactionData.orderId,
                mockTransactionData.amount,
                mockTransactionData.currency,
                mockTransactionData.userId,
                mockTransactionData.metadata
            );

            // Verify fraud detection was called and transaction was flagged but allowed
            expect(keverdService.shouldChallengeTransaction).toHaveBeenCalledWith(60);
            expect(stripe.paymentIntents.create).toHaveBeenCalled();
            expect(result.fraudCheck.riskLevel).toBe('medium');
            expect(result.fraudCheck.action).toBe('soft_challenge');
        });

        it('should proceed when fraud detection is disabled', async () => {
            // Mock disabled fraud detection
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

            // Mock Stripe response
            stripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_test_no_fraud',
                client_secret: 'pi_test_no_fraud_secret',
                status: 'requires_payment_method',
            });

            // Mock repository response
            paymentRepository.create.mockResolvedValue({
                _id: 'payment-no-fraud',
                orderId: mockTransactionData.orderId,
                stripePaymentIntentId: 'pi_test_no_fraud',
                status: 'pending',
                fraudDetection: {
                    enabled: false,
                },
            });

            const result = await paymentService.createPaymentIntent(
                mockTransactionData.orderId,
                mockTransactionData.amount,
                mockTransactionData.currency,
                mockTransactionData.userId,
                mockTransactionData.metadata
            );

            expect(result.fraudCheck.fraudCheckEnabled).toBe(false);
            expect(stripe.paymentIntents.create).toHaveBeenCalled();
        });

        it('should proceed when fraud check fails (graceful degradation)', async () => {
            // Mock fraud check error
            keverdService.assessFraudRisk.mockResolvedValue({
                enabled: true,
                riskScore: 0,
                action: 'allow',
                reasons: ['fraud_check_error'],
                sessionId: null,
                requestId: null,
                error: 'API Error',
            });

            keverdService.shouldBlockTransaction.mockReturnValue(false);
            keverdService.formatFraudDataForResponse.mockReturnValue({
                fraudCheckEnabled: true,
                riskScore: 0,
                riskLevel: 'minimal',
                action: 'allow',
                reasons: ['fraud_check_error'],
            });

            // Mock Stripe response
            stripe.paymentIntents.create.mockResolvedValue({
                id: 'pi_test_error',
                client_secret: 'pi_test_error_secret',
                status: 'requires_payment_method',
            });

            // Mock repository response
            paymentRepository.create.mockResolvedValue({
                _id: 'payment-error',
                orderId: mockTransactionData.orderId,
                stripePaymentIntentId: 'pi_test_error',
                status: 'pending',
                fraudDetection: {
                    enabled: true,
                    riskScore: 0,
                    reasons: ['fraud_check_error'],
                },
            });

            const result = await paymentService.createPaymentIntent(
                mockTransactionData.orderId,
                mockTransactionData.amount,
                mockTransactionData.currency,
                mockTransactionData.userId,
                mockTransactionData.metadata
            );

            // Should succeed despite fraud check error
            expect(result.paymentIntentId).toBe('pi_test_error');
            expect(stripe.paymentIntents.create).toHaveBeenCalled();
        });
    });
});
