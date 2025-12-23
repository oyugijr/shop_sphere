const AccountLockout = require('../models/AccountLockout');

/**
 * Get or create account lockout record for an email
 */
const getOrCreateLockout = async (email) => {
  let lockout = await AccountLockout.findOne({ email });
  
  if (!lockout) {
    lockout = await AccountLockout.create({ email });
  }
  
  return lockout;
};

/**
 * Check if account is locked
 */
const isAccountLocked = async (email) => {
  const lockout = await AccountLockout.findOne({ email });
  
  if (!lockout) {
    return false;
  }
  
  return lockout.isLocked();
};

/**
 * Increment failed login attempts
 */
const incrementFailedAttempts = async (email) => {
  const lockout = await getOrCreateLockout(email);
  await lockout.incrementFailedAttempts();
  return lockout;
};

/**
 * Reset failed attempts on successful login
 */
const resetFailedAttempts = async (email) => {
  const lockout = await AccountLockout.findOne({ email });
  
  if (lockout) {
    await lockout.resetFailedAttempts();
  }
};

/**
 * Get lockout information
 */
const getLockoutInfo = async (email) => {
  const lockout = await AccountLockout.findOne({ email });
  
  if (!lockout) {
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: AccountLockout.MAX_FAILED_ATTEMPTS,
      lockTimeRemaining: 0
    };
  }
  
  return {
    isLocked: lockout.isLocked(),
    failedAttempts: lockout.failedAttempts,
    remainingAttempts: Math.max(0, AccountLockout.MAX_FAILED_ATTEMPTS - lockout.failedAttempts),
    lockTimeRemaining: lockout.getLockTimeRemaining()
  };
};

module.exports = {
  getOrCreateLockout,
  isAccountLocked,
  incrementFailedAttempts,
  resetFailedAttempts,
  getLockoutInfo
};
