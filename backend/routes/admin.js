const express = require('express');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Tenant = require('../models/Tenant');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SubscriptionInvoice = require('../models/SubscriptionInvoice');
const SubscriptionReceipt = require('../models/SubscriptionReceipt');
const { auth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// All admin routes require admin role
router.use(auth);
router.use(requireRole('admin'));

// Get all organizations with detected plans
router.get('/organizations', async (req, res) => {
  try {
    const organizations = await Organization.find()
      .populate('ownerId', 'email firstName lastName')
      .sort({ createdAt: -1 });

    // Add detected plan for each organization
    const organizationsWithPlans = await Promise.all(
      organizations.map(async (org) => {
        const properties = await Property.find({ 
          organizationId: org._id,
          isVerified: true 
        });
        const totalUnits = properties.reduce((sum, prop) => sum + (prop.numberOfUnits || 0), 0);

        let detectedPlan = null;
        if (totalUnits > 0) {
          const plan = await calculatePricing(totalUnits);
          if (plan) {
            detectedPlan = {
              name: plan.name,
              displayName: plan.displayName,
              price: plan.price,
              currency: plan.currency || 'KES',
              billingPeriod: plan.billingPeriod,
              monthlyPrice: plan.billingPeriod === 'monthly' ? plan.price :
                           plan.billingPeriod === 'quarterly' ? plan.price / 3 :
                           plan.price / 12
            };
          }
        }

        return {
          ...org.toObject(),
          totalUnits: totalUnits,
          detectedPlan: detectedPlan
        };
      })
    );

    res.json(organizationsWithPlans);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, organizationId } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (organizationId) query.organizationId = organizationId;

    const users = await User.find(query)
      .select('-password')
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get properties pending verification
router.get('/properties/pending-verification', async (req, res) => {
  try {
    const properties = await Property.find({ isVerified: false })
      .populate('organizationId', 'name')
      .populate('verifiedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Get pending verification properties error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate pricing based on number of units
const calculatePricing = async (numberOfUnits) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ price: 1 });
    
    let selectedPlan = null;
    for (const plan of plans) {
      const maxUnits = plan.features?.maxUnits;
      if (maxUnits === null || maxUnits === undefined) {
        if (!selectedPlan) selectedPlan = plan;
      } else if (numberOfUnits <= maxUnits) {
        selectedPlan = plan;
        break;
      }
    }
    
    if (!selectedPlan && plans.length > 0) {
      selectedPlan = plans[plans.length - 1];
    }
    
    return selectedPlan;
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return null;
  }
};

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    // Calculate expected monthly earnings
    const organizations = await Organization.find({ isActive: true })
      .populate('ownerId', 'firstName lastName email');
    
    let expectedMonthlyEarnings = 0;
    const organizationPlans = [];

    for (const org of organizations) {
      // Calculate total units for this organization
      const properties = await Property.find({ 
        organizationId: org._id,
        isVerified: true 
      });
      const totalUnits = properties.reduce((sum, prop) => sum + (prop.numberOfUnits || 0), 0);

      if (totalUnits > 0) {
        const plan = await calculatePricing(totalUnits);
        if (plan) {
          // Convert to monthly if needed
          let monthlyPrice = plan.price;
          if (plan.billingPeriod === 'quarterly') {
            monthlyPrice = plan.price / 3;
          } else if (plan.billingPeriod === 'yearly') {
            monthlyPrice = plan.price / 12;
          }
          
          expectedMonthlyEarnings += monthlyPrice;
          
          organizationPlans.push({
            organizationId: org._id,
            organizationName: org.name,
            totalUnits: totalUnits,
            detectedPlan: plan.name,
            planPrice: plan.price,
            monthlyPrice: monthlyPrice,
            currency: plan.currency || 'KES',
            billingPeriod: plan.billingPeriod
          });
        }
      }
    }

    // Get current month's subscription invoices
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const currentMonthInvoices = await SubscriptionInvoice.find({
      invoiceDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const currentMonthRevenue = currentMonthInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.paidAmount, 0);

    const stats = {
      totalOrganizations: await Organization.countDocuments(),
      totalUsers: await User.countDocuments(),
      totalProperties: await Property.countDocuments(),
      totalUnits: await Unit.countDocuments(),
      totalTenants: await Tenant.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      managers: await User.countDocuments({ role: 'manager' }),
      landlords: await User.countDocuments({ role: 'landlord' }),
      tenants: await User.countDocuments({ role: 'tenant' }),
      expectedMonthlyEarnings: expectedMonthlyEarnings,
      currentMonthRevenue: currentMonthRevenue,
      organizationPlans: organizationPlans
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin user
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const admin = new User({
      email,
      password,
      role: 'admin',
      firstName,
      lastName,
      isFirstTimeLogin: false,
      onboardingCompleted: true
    });

    await admin.save();

    // Log admin creation
    await logAction({
      action: 'Admin User Created',
      category: 'admin',
      user: req.user,
      resourceType: 'User',
      resourceId: admin._id,
      details: `Admin user created: ${admin.email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      message: 'Admin created successfully',
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    // Log user status change
    await logAction({
      action: 'User Status Updated',
      category: 'user',
      user: req.user,
      resourceType: 'User',
      resourceId: user._id,
      details: `User ${isActive ? 'activated' : 'deactivated'}: ${user.email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'User status updated', user });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update organization
router.put('/organizations/:id', async (req, res) => {
  try {
    const { subscriptionPlan, isActive } = req.body;
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (subscriptionPlan) organization.subscriptionPlan = subscriptionPlan;
    if (isActive !== undefined) organization.isActive = isActive;

    await organization.save();
    res.json(organization);
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete organization
router.delete('/organizations/:id', async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Delete all related data
    await Property.deleteMany({ organizationId: organization._id });
    await Unit.deleteMany({ organizationId: organization._id });
    await Tenant.deleteMany({ organizationId: organization._id });
    await User.updateMany({ organizationId: organization._id }, { organizationId: null });
    await organization.deleteOne();

    // Log organization deletion
    await logAction({
      action: 'Organization Deleted',
      category: 'organization',
      user: req.user,
      resourceType: 'Organization',
      resourceId: organization._id,
      details: `Organization deleted: ${organization.name}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Organization and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete all non-admin users (Admin only - DANGEROUS OPERATION)
router.delete('/users/delete-all-non-admins', async (req, res) => {
  try {
    // Count users before deletion
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const nonAdminUsers = totalUsers - adminUsers;

    // Get list of users to be deleted (for logging)
    const usersToDelete = await User.find({ role: { $ne: 'admin' } })
      .select('email role firstName lastName');

    // Delete all non-admin users
    const result = await User.deleteMany({ role: { $ne: 'admin' } });

    // Log the deletion
    await logAction({
      action: 'All Non-Admin Users Deleted',
      category: 'user',
      user: req.user,
      resourceType: 'User',
      details: `Deleted ${result.deletedCount} non-admin users. Remaining: ${adminUsers} admin users.`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({ 
      message: `Successfully deleted ${result.deletedCount} non-admin users. ${adminUsers} admin users remain.`,
      deleted: result.deletedCount,
      remaining: adminUsers,
      deletedUsers: usersToDelete.map(u => ({
        email: u.email,
        role: u.role,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim()
      }))
    });
  } catch (error) {
    console.error('Delete all non-admin users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete single user (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users (safety measure)
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users. Use deactivate instead.' });
    }

    // If user is a landlord/manager, handle organization cleanup
    if (user.organizationId && (user.role === 'landlord' || user.role === 'manager')) {
      const organization = await Organization.findById(user.organizationId);
      
      // If user is the owner, we might want to handle this differently
      if (organization && organization.ownerId.toString() === user._id.toString()) {
        // Optionally delete the organization and all its data
        // For now, just remove the user
      }
    }

    // Delete the user
    await user.deleteOne();

    // Log user deletion
    await logAction({
      action: 'User Deleted',
      category: 'user',
      user: req.user,
      resourceType: 'User',
      resourceId: user._id,
      details: `User deleted: ${user.email} (${user.role})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
