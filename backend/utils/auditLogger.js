const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the audit log
 * @param {Object} logData - The audit log data
 * @param {String} logData.action - The action performed (e.g., 'User Login', 'Property Created')
 * @param {String} logData.category - The category (auth, user, organization, etc.)
 * @param {Object} logData.user - The user object (optional)
 * @param {String} logData.organizationId - The organization ID (optional)
 * @param {String} logData.resourceType - Type of resource affected (optional)
 * @param {String} logData.resourceId - ID of resource affected (optional)
 * @param {String} logData.details - Additional details (optional)
 * @param {String} logData.ipAddress - IP address (optional)
 * @param {String} logData.userAgent - User agent (optional)
 * @param {String} logData.status - Status (success, failed, pending) - default: success
 * @param {String} logData.errorMessage - Error message if status is failed (optional)
 * @param {Object} logData.metadata - Additional metadata (optional)
 */
async function logAction(logData) {
  try {
    const {
      action,
      category,
      user,
      organizationId,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status = 'success',
      errorMessage,
      metadata = {}
    } = logData;

    if (!action || !category) {
      console.warn('Audit log: action and category are required');
      return;
    }

    const auditLog = new AuditLog({
      action,
      category,
      userId: user?._id || user?.id || null,
      userEmail: user?.email || null,
      userRole: user?.role || null,
      organizationId: organizationId || user?.organizationId || null,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status,
      errorMessage,
      metadata
    });

    await auditLog.save();
  } catch (error) {
    // Don't throw error to prevent breaking the main action
    console.error('Error saving audit log:', error);
  }
}

module.exports = { logAction };
