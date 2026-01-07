const keverdService = require('../../../src/services/keverdService');

// Mock Keverd SDK
jest.mock('@keverdjs/fraud-sdk', () => ({
    Keverd: {
        init: jest.fn(),
        getVisitorData: jest.fn(),
    },
}));

const { Keverd } = require('@keverdjs/fraud-sdk');

describe('Keverd Service', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset environment variables
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('initKeverd', () => {
        it('should initialize Keverd SDK with API key', () => {
            process.env.KEVERD_API_KEY = 'test-api-key';
            process.env.KEVERD_ENDPOINT = 'https://test.keverd.com';

            const result = keverdService.initKeverd();

            expect(Keverd.init).toHaveBeenCalledWith({
                apiKey: 'test-api-key',
                endpoint: 'https://test.keverd.com',
                debug: false,
            });
            expect(result).toBe(true);
        });

        it('should return false when API key is not configured', () => {
            delete process.env.KEVERD_API_KEY;

            const result = keverdService.initKeverd();

            expect(Keverd.init).not.toHaveBeenCalled();
            expect(result).toBe(false);
        });

        it('should use default endpoint if not provided', () => {
            process.env.KEVERD_API_KEY = 'test-api-key';
            delete process.env.KEVERD_ENDPOINT;

            keverdService.initKeverd();

            expect(Keverd.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    endpoint: 'https://app.keverd.com',
                })
            );
        });

        it('should enable debug mode in development', () => {
            process.env.KEVERD_API_KEY = 'test-api-key';
            process.env.NODE_ENV = 'development';

            keverdService.initKeverd();

            expect(Keverd.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    debug: true,
                })
            );
        });
    });

    describe('isEnabled', () => {
        it('should return true when enabled and has API key', () => {
            process.env.KEVERD_ENABLED = 'true';
            process.env.KEVERD_API_KEY = 'test-api-key';

            expect(keverdService.isEnabled()).toBe(true);
        });

        it('should return false when disabled', () => {
            process.env.KEVERD_ENABLED = 'false';
            process.env.KEVERD_API_KEY = 'test-api-key';

            expect(keverdService.isEnabled()).toBe(false);
        });

        it('should return false when API key is missing', () => {
            process.env.KEVERD_ENABLED = 'true';
            delete process.env.KEVERD_API_KEY;

            expect(keverdService.isEnabled()).toBe(false);
        });
    });

    describe('assessFraudRisk', () => {
        const mockTransactionData = {
            orderId: 'order-123',
            userId: 'user-456',
            amount: 100.0,
            currency: 'usd',
            metadata: {},
        };

        it('should return disabled status when fraud detection is disabled', async () => {
            process.env.KEVERD_ENABLED = 'false';

            const result = await keverdService.assessFraudRisk(mockTransactionData);

            expect(result.enabled).toBe(false);
            expect(result.action).toBe('allow');
            expect(Keverd.getVisitorData).not.toHaveBeenCalled();
        });

        it('should assess fraud risk and return data when enabled', async () => {
            process.env.KEVERD_ENABLED = 'true';
            process.env.KEVERD_API_KEY = 'test-api-key';

            const mockKeverdResponse = {
                risk_score: 25,
                score: 0.25,
                action: 'allow',
                reason: ['low_risk'],
                session_id: 'session-123',
                requestId: 'request-456',
            };

            Keverd.getVisitorData.mockResolvedValue(mockKeverdResponse);

            const result = await keverdService.assessFraudRisk(mockTransactionData);

            expect(Keverd.getVisitorData).toHaveBeenCalled();
            expect(result.enabled).toBe(true);
            expect(result.riskScore).toBe(25);
            expect(result.action).toBe('allow');
            expect(result.reasons).toEqual(['low_risk']);
            expect(result.sessionId).toBe('session-123');
            expect(result.requestId).toBe('request-456');
        });

        it('should handle high risk score', async () => {
            process.env.KEVERD_ENABLED = 'true';
            process.env.KEVERD_API_KEY = 'test-api-key';

            const mockKeverdResponse = {
                risk_score: 85,
                score: 0.85,
                action: 'block',
                reason: ['suspicious_activity', 'high_velocity'],
                session_id: 'session-789',
                requestId: 'request-012',
            };

            Keverd.getVisitorData.mockResolvedValue(mockKeverdResponse);

            const result = await keverdService.assessFraudRisk(mockTransactionData);

            expect(result.riskScore).toBe(85);
            expect(result.action).toBe('block');
            expect(result.reasons).toContain('suspicious_activity');
            expect(result.reasons).toContain('high_velocity');
        });

        it('should handle errors gracefully', async () => {
            process.env.KEVERD_ENABLED = 'true';
            process.env.KEVERD_API_KEY = 'test-api-key';

            Keverd.getVisitorData.mockRejectedValue(new Error('API Error'));

            const result = await keverdService.assessFraudRisk(mockTransactionData);

            expect(result.enabled).toBe(true);
            expect(result.action).toBe('allow');
            expect(result.reasons).toContain('fraud_check_error');
            expect(result.error).toBe('API Error');
        });
    });

    describe('shouldBlockTransaction', () => {
        it('should block transaction when risk score exceeds threshold', () => {
            process.env.KEVERD_BLOCK_THRESHOLD = '75';

            expect(keverdService.shouldBlockTransaction(80)).toBe(true);
            expect(keverdService.shouldBlockTransaction(75)).toBe(true);
            expect(keverdService.shouldBlockTransaction(70)).toBe(false);
        });

        it('should use default threshold of 75 when not configured', () => {
            delete process.env.KEVERD_BLOCK_THRESHOLD;

            expect(keverdService.shouldBlockTransaction(80)).toBe(true);
            expect(keverdService.shouldBlockTransaction(75)).toBe(true);
            expect(keverdService.shouldBlockTransaction(70)).toBe(false);
        });
    });

    describe('shouldChallengeTransaction', () => {
        it('should challenge transaction when risk score is between thresholds', () => {
            process.env.KEVERD_CHALLENGE_THRESHOLD = '50';
            process.env.KEVERD_BLOCK_THRESHOLD = '75';

            expect(keverdService.shouldChallengeTransaction(60)).toBe(true);
            expect(keverdService.shouldChallengeTransaction(50)).toBe(true);
            expect(keverdService.shouldChallengeTransaction(45)).toBe(false);
            expect(keverdService.shouldChallengeTransaction(75)).toBe(false);
            expect(keverdService.shouldChallengeTransaction(80)).toBe(false);
        });

        it('should use default thresholds when not configured', () => {
            delete process.env.KEVERD_CHALLENGE_THRESHOLD;
            delete process.env.KEVERD_BLOCK_THRESHOLD;

            expect(keverdService.shouldChallengeTransaction(60)).toBe(true);
            expect(keverdService.shouldChallengeTransaction(50)).toBe(true);
            expect(keverdService.shouldChallengeTransaction(45)).toBe(false);
        });
    });

    describe('getRiskLevel', () => {
        it('should return correct risk level for score', () => {
            expect(keverdService.getRiskLevel(0)).toBe('minimal');
            expect(keverdService.getRiskLevel(20)).toBe('minimal');
            expect(keverdService.getRiskLevel(30)).toBe('low');
            expect(keverdService.getRiskLevel(55)).toBe('medium');
            expect(keverdService.getRiskLevel(80)).toBe('high');
            expect(keverdService.getRiskLevel(100)).toBe('high');
        });
    });

    describe('formatFraudDataForResponse', () => {
        it('should format fraud data for API response', () => {
            const fraudData = {
                enabled: true,
                riskScore: 35,
                action: 'allow',
                reasons: ['new_user'],
                sessionId: 'session-123',
                requestId: 'request-456',
            };

            const result = keverdService.formatFraudDataForResponse(fraudData);

            expect(result).toEqual({
                fraudCheckEnabled: true,
                riskScore: 35,
                riskLevel: 'low',
                action: 'allow',
                reasons: ['new_user'],
                sessionId: 'session-123',
            });
        });

        it('should return minimal data when fraud detection is disabled', () => {
            const fraudData = {
                enabled: false,
            };

            const result = keverdService.formatFraudDataForResponse(fraudData);

            expect(result).toEqual({
                fraudCheckEnabled: false,
            });
        });

        it('should handle null or undefined input', () => {
            expect(keverdService.formatFraudDataForResponse(null)).toEqual({
                fraudCheckEnabled: false,
            });

            expect(keverdService.formatFraudDataForResponse(undefined)).toEqual({
                fraudCheckEnabled: false,
            });
        });
    });
});