const express = require('express');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { auth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Add manager to organization (Landlord only)
router.post('/add', requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        message: 'Email, password, first name, and last name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists. Please use a different email.' 
      });
    }

    // Verify the requesting user is a landlord or admin
    if (req.user.role !== 'admin' && !req.user.organizationId) {
      return res.status(403).json({ message: 'You must be associated with an organization' });
    }

    const organizationId = req.user.role === 'admin' && req.body.organizationId
      ? req.body.organizationId
      : req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Verify organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Verify landlord owns the organization (unless admin)
    if (req.user.role !== 'admin' && organization.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only add managers to your own organization' });
    }

    // Create manager user
    const manager = new User({
      email: email.toLowerCase().trim(),
      password,
      role: 'manager',
      firstName,
      lastName,
      phone: phone || null,
      organizationId,
      isFirstTimeLogin: true,
      onboardingCompleted: false
    });

    await manager.save();

    // Log manager creation
    await logAction({
      action: 'Manager Added',
      category: 'user_management',
      user: req.user,
      organizationId: organizationId,
      resourceType: 'User',
      resourceId: manager._id,
      details: `Manager ${manager.email} added to organization ${organization.name}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      message: 'Manager added successfully',
      manager: {
        id: manager._id,
        email: manager.email,
        firstName: manager.firstName,
        lastName: manager.lastName,
        phone: manager.phone,
        organizationId: manager.organizationId
      }
    });
  } catch (error) {
    console.error('Add manager error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all managers for organization (Landlord/Manager/Admin)
router.get('/', requireRole('landlord', 'manager', 'admin'), async (req, res) => {
  try {
    let query = { role: 'manager' };

    if (req.user.role === 'admin' && req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    } else if (req.user.role !== 'admin') {
      query.organizationId = req.user.organizationId;
    }

    const managers = await User.find(query)
      .select('-password')
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 });

    res.json(managers);
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove manager from organization (Landlord/Admin only)
router.delete('/:id', requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const manager = await User.findById(req.params.id);

    if (!manager || manager.role !== 'manager') {
      return res.status(404).json({ message: 'Manager not found' });
    }

    // Verify access
    if (req.user.role !== 'admin') {
      if (!req.user.organizationId || manager.organizationId.toString() !== req.user.organizationId.toString()) {
        return res.status(403).json({ message: 'You can only remove managers from your own organization' });
      }

      // Verify landlord owns the organization
      const organization = await Organization.findById(req.user.organizationId);
      if (!organization || organization.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the organization owner can remove managers' });
      }
    }

    // Deactivate instead of deleting (preserve data)
    manager.isActive = false;
    await manager.save();

    // Log manager removal
    await logAction({
      action: 'Manager Removed',
      category: 'user_management',
      user: req.user,
      organizationId: manager.organizationId,
      resourceType: 'User',
      resourceId: manager._id,
      details: `Manager ${manager.email} removed from organization`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Manager removed successfully' });
  } catch (error) {
    console.error('Remove manager error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reactivate manager (Landlord/Admin only)
router.put('/:id/reactivate', requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const manager = await User.findById(req.params.id);

    if (!manager || manager.role !== 'manager') {
      return res.status(404).json({ message: 'Manager not found' });
    }

    // Verify access
    if (req.user.role !== 'admin') {
      if (!req.user.organizationId || manager.organizationId.toString() !== req.user.organizationId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    manager.isActive = true;
    await manager.save();

    res.json({ message: 'Manager reactivated successfully', manager });
  } catch (error) {
    console.error('Reactivate manager error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
