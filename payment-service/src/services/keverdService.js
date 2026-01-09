const { Keverd } = require('@keverdjs/fraud-sdk');

const DEFAULT_ENDPOINT = 'https://app.keverd.com';
const DEFAULT_BLOCK_THRESHOLD = 75;
const DEFAULT_CHALLENGE_THRESHOLD = 50;
const ALLOWED_CONTEXT_FIELDS = [
    'ip',
    'userAgent',
    'acceptLanguage',
    'referer',
    'deviceId',
    'sessionId',
    'path',
    'method',
    'userId',
    'timestamp',
];

let keverdInitialized = false;

/**
 * Initialize Keverd SDK
 */
const initKeverd = () => {
    const apiKey = process.env.KEVERD_API_KEY;
    const endpoint = process.env.KEVERD_ENDPOINT || DEFAULT_ENDPOINT;
    const debug = process.env.NODE_ENV === 'development';

    if (!apiKey) {
        keverdInitialized = false;
        return false;
    }

    try {
        Keverd.init({ apiKey, endpoint, debug });
        keverdInitialized = true;
        return true;
    } catch (error) {
        keverdInitialized = false;
        return false;
    }
};

/**
 * Check if fraud detection is enabled
 */
const isEnabled = () => {
    if (process.env.KEVERD_ENABLED === 'false') return false;
    if (!process.env.KEVERD_API_KEY) return false;

    if (!keverdInitialized) {
        return initKeverd();
    }

    return keverdInitialized;
};

const sanitizeContext = (context = {}) => {
    if (!context || typeof context !== 'object') {
        return {};
    }

    return ALLOWED_CONTEXT_FIELDS.reduce((acc, field) => {
        if (context[field] !== undefined) {
            acc[field] = context[field];
        }
        return acc;
    }, {});
};

/**
 * Assess fraud risk for a transaction
 */
const assessFraudRisk = async (transactionData, requestContext = {}) => {
    if (!isEnabled()) {
        return {
            enabled: false,
            action: 'allow',
            reasons: ['fraud_detection_disabled'],
        };
    }

    if (!keverdInitialized) {
        initKeverd();
    }

    if (!transactionData || typeof transactionData !== 'object') {
        return {
            enabled: true,
            action: 'allow',
            reasons: ['invalid_transaction'],
        };
    }

    const context = sanitizeContext(requestContext);

    try {
        const payload = {
            ...context,
            metadata: {
                orderId: transactionData.orderId,
                userId: transactionData.userId,
                amount: transactionData.amount,
                currency: transactionData.currency,
            },
        };

        const result = await Keverd.getVisitorData(payload);

        return {
            enabled: true,
            riskScore: Number(result.risk_score) || 0,
            score: Number(result.score) || 0,
            action: result.action || 'allow',
            reasons: Array.isArray(result.reason) ? result.reason : [],
            sessionId: result.session_id || null,
            requestId: result.requestId || null,
            checkedAt: new Date(),
            context,
        };
    } catch (error) {
        return {
            enabled: false,
            action: 'allow',
            reasons: ['fraud_check_error'],
            error: error.message,
            context,
        };
    }
};

/**
 * Parse numeric env values safely
 */
const parseThreshold = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Block logic
 */
const shouldBlockTransaction = (riskScore) => {
    const threshold = parseThreshold(
        process.env.KEVERD_BLOCK_THRESHOLD,
        DEFAULT_BLOCK_THRESHOLD
    );
    return riskScore >= threshold;
};

/**
 * Challenge logic
 */
const shouldChallengeTransaction = (riskScore) => {
    const challengeThreshold = parseThreshold(
        process.env.KEVERD_CHALLENGE_THRESHOLD,
        DEFAULT_CHALLENGE_THRESHOLD
    );
    const blockThreshold = parseThreshold(
        process.env.KEVERD_BLOCK_THRESHOLD,
        DEFAULT_BLOCK_THRESHOLD
    );

    return riskScore >= challengeThreshold && riskScore < blockThreshold;
};

/**
 * Risk level mapping
 */
const getRiskLevel = (riskScore) => {
    if (riskScore >= 75) return 'high';
    if (riskScore >= 50) return 'medium';
    if (riskScore >= 25) return 'low';
    return 'minimal';
};

/**
 * API response formatter
 */
const formatFraudDataForResponse = (fraudData) => {
    if (!fraudData || fraudData.enabled !== true) {
        return { fraudCheckEnabled: false };
    }

    return {
        fraudCheckEnabled: true,
        riskScore: fraudData.riskScore,
        riskLevel: getRiskLevel(fraudData.riskScore),
        action: fraudData.action,
        reasons: fraudData.reasons,
        sessionId: fraudData.sessionId,
    };
};

module.exports = {
    initKeverd,
    isEnabled,
    assessFraudRisk,
    shouldBlockTransaction,
    shouldChallengeTransaction,
    getRiskLevel,
    formatFraudDataForResponse,
};
