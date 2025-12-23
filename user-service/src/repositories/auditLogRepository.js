const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event
 */
const logEvent = async (eventData) => {
  return await AuditLog.log(eventData);
};

/**
 * Get audit logs for a user
 */
const getUserLogs = async (userId, limit = 50) => {
  return await AuditLog.getUserLogs(userId, limit);
};

/**
 * Get failed login attempts for an email
 */
const getFailedLoginAttempts = async (email, since = null) => {
  return await AuditLog.getFailedLoginAttempts(email, since);
};

/**
 * Get suspicious activity from an IP address
 */
const getSuspiciousActivity = async (ipAddress, hours = 24) => {
  return await AuditLog.getSuspiciousActivity(ipAddress, hours);
};

/**
 * Get recent audit logs with filters
 */
const getRecentLogs = async (filters = {}, limit = 100) => {
  const query = {};
  
  if (filters.userId) query.userId = filters.userId;
  if (filters.email) query.email = filters.email;
  if (filters.action) query.action = filters.action;
  if (filters.ipAddress) query.ipAddress = filters.ipAddress;
  if (filters.success !== undefined) query.success = filters.success;
  
  return await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v');
};

module.exports = {
  logEvent,
  getUserLogs,
  getFailedLoginAttempts,
  getSuspiciousActivity,
  getRecentLogs
};
