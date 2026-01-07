const { Keverd } = require('@keverdjs/fraud-sdk');

/**
 * Initialize Keverd SDK
 */
const initKeverd = () => {
  const apiKey = process.env.KEVERD_API_KEY;
  const endpoint = process.env.KEVERD_ENDPOINT || 'https://app.keverd.com';
  const debug = process.env.NODE_ENV === 'development';

  if (!apiKey) {
    console.warn('Keverd API key not configured. Fraud detection will be disabled.');
    return false;
  }

  try {
    Keverd.init({
      apiKey,
      endpoint,
      debug,
    });
    console.log('Keverd fraud detection initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Keverd:', error);
    return false;
  }
};

/**
 * Check if fraud detection is enabled
 */
const isEnabled = () => {
  const enabled = process.env.KEVERD_ENABLED !== 'false';
  const hasApiKey = !!process.env.KEVERD_API_KEY;
  return enabled && hasApiKey;
};

/**
 * Assess fraud risk for a transaction
 * @param {Object} transactionData - Transaction metadata
 * @param {string} transactionData.orderId - Order ID
 * @param {string} transactionData.userId - User ID
 * @param {number} transactionData.amount - Transaction amount
 * @param {string} transactionData.currency - Currency code
 * @param {Object} transactionData.metadata - Additional metadata
 * @returns {Promise<Object>} Fraud assessment result
 */
const assessFraudRisk = async (transactionData) => {
  if (!isEnabled()) {
    console.log('Fraud detection is disabled');
    return {
      enabled: false,
      riskScore: 0,
      action: 'allow',
      reasons: ['fraud_detection_disabled'],
      sessionId: null,
      requestId: null,
    };
  }

  try {
    // Get visitor data and risk assessment from Keverd
    const result = await Keverd.getVisitorData();

    // Parse the result
    const fraudData = {
      enabled: true,
      riskScore: result.risk_score || 0,
      score: result.score || 0,
      action: result.action || 'allow',
      reasons: result.reason || [],
      sessionId: result.session_id || null,
      requestId: result.requestId || null,
      checkedAt: new Date(),
    };

    console.log(`Fraud check for order ${transactionData.orderId}:`, {
      riskScore: fraudData.riskScore,
      action: fraudData.action,
      reasons: fraudData.reasons,
    });

    return fraudData;
  } catch (error) {
    console.error('Error assessing fraud risk:', error);
    // Don't block transactions if fraud detection fails
    return {
      enabled: true,
      riskScore: 0,
      action: 'allow',
      reasons: ['fraud_check_error'],
      sessionId: null,
      requestId: null,
      error: error.message,
    };
  }
};

/**
 * Determine if a transaction should be blocked based on risk score
 * @param {number} riskScore - Risk score from 0-100
 * @returns {boolean} Whether to block the transaction
 */
const shouldBlockTransaction = (riskScore) => {
  const threshold = parseInt(process.env.KEVERD_BLOCK_THRESHOLD) || 75;
  return riskScore >= threshold;
};

/**
 * Determine if a transaction should be challenged based on risk score
 * @param {number} riskScore - Risk score from 0-100
 * @returns {boolean} Whether to challenge the transaction
 */
const shouldChallengeTransaction = (riskScore) => {
  const threshold = parseInt(process.env.KEVERD_CHALLENGE_THRESHOLD) || 50;
  const blockThreshold = parseInt(process.env.KEVERD_BLOCK_THRESHOLD) || 75;
  return riskScore >= threshold && riskScore < blockThreshold;
};

/**
 * Get fraud risk level description
 * @param {number} riskScore - Risk score from 0-100
 * @returns {string} Risk level description
 */
const getRiskLevel = (riskScore) => {
  if (riskScore >= 75) return 'high';
  if (riskScore >= 50) return 'medium';
  if (riskScore >= 25) return 'low';
  return 'minimal';
};

/**
 * Format fraud detection data for API response
 * @param {Object} fraudData - Fraud detection data from assessment
 * @returns {Object} Formatted fraud data for API
 */
const formatFraudDataForResponse = (fraudData) => {
  if (!fraudData || !fraudData.enabled) {
    return {
      fraudCheckEnabled: false,
    };
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
