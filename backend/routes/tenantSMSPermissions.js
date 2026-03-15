const express = require('express');
const Tenant = require('../models/Tenant');
const { auth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get SMS permission status for a tenant
router.get('/:tenantId', requireRole('manager', 'landlord', 'admin', 'tenant'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId)
      .populate('smsDisableApprovedBy', 'firstName lastName email');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check access permissions
    if (req.user.role === 'tenant') {
      const tenantUser = await Tenant.findOne({ userId: req.user._id });
      if (!tenantUser || tenantUser._id.toString() !== req.params.tenantId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      // Manager/Landlord/Admin must belong to same organization
      if (tenant.organizationId.toString() !== req.user.organizationId?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({
      smsRemindersDisabled: tenant.smsRemindersDisabled,
      smsDisabledUntil: tenant.smsDisabledUntil,
      smsDisableReason: tenant.smsDisableReason,
      smsDisableRequestedBy: tenant.smsDisableRequestedBy,
      smsDisableApprovedBy: tenant.smsDisableApprovedBy,
      smsDisableApprovedAt: tenant.smsDisableApprovedAt
    });
  } catch (error) {
    console.error('Get SMS permission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request to disable SMS (Tenant can request)
router.post('/:tenantId/request-disable', requireRole('tenant'), async (req, res) => {
  try {
    const { reason, promiseToPayDate } = req.body;

    if (!promiseToPayDate) {
      return res.status(400).json({ message: 'Promise to pay date is required' });
    }

    const tenant = await Tenant.findOne({ userId: req.user._id });

    if (!tenant || tenant._id.toString() !== req.params.tenantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    tenant.smsRemindersDisabled = true;
    tenant.smsDisabledUntil = new Date(promiseToPayDate);
    tenant.smsDisableReason = reason || 'Tenant requested to disable SMS reminders';
    tenant.smsDisableRequestedBy = 'tenant';

    await tenant.save();

    // Log the request
    await logAction({
      action: 'SMS Disable Requested',
      category: 'sms',
      user: req.user,
      organizationId: tenant.organizationId,
      resourceType: 'Tenant',
      resourceId: tenant._id,
      details: `Tenant requested to disable SMS reminders until ${new Date(promiseToPayDate).toLocaleDateString()}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'SMS disable request submitted. Landlord/Manager will be notified.',
      tenant: {
        smsRemindersDisabled: tenant.smsRemindersDisabled,
        smsDisabledUntil: tenant.smsDisabledUntil,
        smsDisableReason: tenant.smsDisableReason
      }
    });
  } catch (error) {
    console.error('Request SMS disable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Disable SMS for tenant (Landlord/Manager)
router.put('/:tenantId/disable', requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { disabled, disabledUntil, reason } = req.body;

    const tenant = await Tenant.findOne({
      _id: req.params.tenantId,
      organizationId: req.user.organizationId
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.smsRemindersDisabled = disabled !== false;
    tenant.smsDisabledUntil = disabledUntil ? new Date(disabledUntil) : null;
    tenant.smsDisableReason = reason || null;
    tenant.smsDisableRequestedBy = disabled ? 'landlord' : null;
    tenant.smsDisableApprovedBy = disabled ? req.user._id : null;
    tenant.smsDisableApprovedAt = disabled ? new Date() : null;

    await tenant.save();

    // Log the action
    await logAction({
      action: disabled ? 'SMS Reminders Disabled' : 'SMS Reminders Enabled',
      category: 'sms',
      user: req.user,
      organizationId: tenant.organizationId,
      resourceType: 'Tenant',
      resourceId: tenant._id,
      details: disabled 
        ? `SMS reminders disabled for tenant until ${disabledUntil ? new Date(disabledUntil).toLocaleDateString() : 'further notice'}`
        : 'SMS reminders enabled for tenant',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: disabled ? 'SMS reminders disabled successfully' : 'SMS reminders enabled successfully',
      tenant: {
        smsRemindersDisabled: tenant.smsRemindersDisabled,
        smsDisabledUntil: tenant.smsDisabledUntil,
        smsDisableReason: tenant.smsDisableReason
      }
    });
  } catch (error) {
    console.error('Disable SMS error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all tenants with SMS permission status (Landlord/Manager)
router.get('/', requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const tenants = await Tenant.find({ organizationId: req.user.organizationId })
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId')
      .populate('smsDisableApprovedBy', 'firstName lastName email')
      .select('firstName lastName phoneNumber smsRemindersDisabled smsDisabledUntil smsDisableReason smsDisableRequestedBy smsDisableApprovedBy smsDisableApprovedAt leaseStartDate')
      .sort({ createdAt: -1 });

    res.json(tenants);
  } catch (error) {
    console.error('Get tenants SMS permissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
