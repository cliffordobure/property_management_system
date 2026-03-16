const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const { auth } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone, listingType } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    // Managers cannot register themselves - they must be created by landlords
    if (!['landlord', 'tenant'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Managers must be created by landlords through the Managers page.' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      role,
      firstName,
      lastName,
      phone
    });

    // Create organization for landlord only (managers are created by landlords)
    if (role === 'landlord') {
      const orgListingType = ['full_management', 'advertise_only'].includes(listingType) ? listingType : 'full_management';
      const organization = new Organization({
        name: `${firstName || 'Organization'}'s Properties`,
        ownerId: user._id,
        listingType: orgListingType
      });
      await organization.save();
      user.organizationId = organization._id;
    }

    await user.save();

    // Log registration
    await logAction({
      action: 'User Registration',
      category: 'auth',
      user: user,
      organizationId: user.organizationId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: `New ${role} user registered`
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    const org = role === 'landlord' ? await Organization.findById(user.organizationId).select('listingType').lean() : null;
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        listingType: org?.listingType || null,
        isFirstTimeLogin: user.isFirstTimeLogin,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Log failed login attempt (user not found)
      await logAction({
        action: 'User Login',
        category: 'auth',
        userEmail: email,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        status: 'failed',
        errorMessage: 'User not found',
        details: 'Failed login attempt - user not found'
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check role if provided
    // Allow admin to login with "manager" or "landlord" selection (since they have similar permissions)
    if (role && user.role !== 'admin') {
      // When "Manager/Landlord/Admin" button is selected, frontend sends 'manager'
      // But both managers and landlords should be able to login with this selection
      if (role === 'manager') {
        // Accept both 'manager' and 'landlord' roles when 'manager' is sent from frontend
        if (user.role !== 'manager' && user.role !== 'landlord') {
          return res.status(400).json({ message: 'Invalid role for this account' });
        }
      } else {
        // For other roles (tenant), role must match exactly
        if (user.role !== role) {
          return res.status(400).json({ message: 'Invalid role for this account' });
        }
      }
    }
    // Admins can login with any role selection (manager/landlord/tenant)

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt
      await logAction({
        action: 'User Login',
        category: 'auth',
        user: user,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        status: 'failed',
        errorMessage: 'Invalid password',
        details: 'Failed login attempt'
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // For tenants, check if their property is verified
    if (user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: user._id })
        .populate('propertyId');
      
      if (tenant && tenant.propertyId) {
        if (!tenant.propertyId.isVerified) {
          // Log blocked login attempt
          await logAction({
            action: 'User Login',
            category: 'auth',
            user: user,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            status: 'failed',
            errorMessage: 'Property not verified',
            details: `Tenant login blocked - property "${tenant.propertyId.propertyName}" is not verified`
          });
          
          return res.status(403).json({ 
            message: 'Access denied. Your property has not been verified yet. Please contact your landlord or wait for verification.',
            code: 'PROPERTY_NOT_VERIFIED',
            propertyName: tenant.propertyId.propertyName
          });
        }
      }
    }

    // Log successful login
    await logAction({
      action: 'User Login',
      category: 'auth',
      user: user,
      organizationId: user.organizationId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: 'User logged in successfully'
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    let listingType = null;
    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId).select('listingType').lean();
      listingType = org?.listingType || null;
    }

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        listingType,
        isFirstTimeLogin: user.isFirstTimeLogin,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update first-time login info
router.put('/welcome', auth, async (req, res) => {
  try {
    const { isFirstTime, howDidYouHearAboutUs } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Always set isFirstTimeLogin to false after completing welcome page
    // This ensures the welcome page only shows once for new account creation
    user.isFirstTimeLogin = false;
    
    if (howDidYouHearAboutUs) {
      user.howDidYouHearAboutUs = howDidYouHearAboutUs;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        isFirstTimeLogin: false,
        howDidYouHearAboutUs: user.howDidYouHearAboutUs
      }
    });
  } catch (error) {
    console.error('Welcome update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete onboarding
router.put('/onboarding/complete', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.onboardingCompleted = true;
    await user.save();

    res.json({ message: 'Onboarding completed', onboardingCompleted: true });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').lean();
    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId).select('listingType').lean();
      user.listingType = org?.listingType || null;
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password (will be hashed automatically by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
