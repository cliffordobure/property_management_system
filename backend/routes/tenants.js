const express = require('express');
const Tenant = require('../models/Tenant');
const Unit = require('../models/Unit');
const Property = require('../models/Property');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/tenants';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get tenant by user ID (for tenant role)
router.get('/my-info', auth, async (req, res) => {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Access denied. This endpoint is for tenants only.' });
    }

    // First try to find tenant by userId (linked account)
    let tenant = await Tenant.findOne({ userId: req.user._id })
      .populate('propertyId')
      .populate('unitId')
      .populate('organizationId', 'name');

    // If not found by userId, try to find by email (in case email matches but not linked)
    if (!tenant && req.user.email) {
      tenant = await Tenant.findOne({ 
        email: req.user.email.toLowerCase().trim() 
      })
      .populate('propertyId')
      .populate('unitId')
      .populate('organizationId', 'name');
      
      // If found by email but not linked, link them automatically
      if (tenant && !tenant.userId) {
        tenant.userId = req.user._id;
        await tenant.save();
      }
    }

    if (!tenant) {
      // Check if any tenant record exists with this email (for better error message)
      const tenantByEmail = req.user.email 
        ? await Tenant.findOne({ email: req.user.email.toLowerCase().trim() })
        : null;
      
      if (tenantByEmail && tenantByEmail.userId) {
        return res.status(404).json({ 
          message: 'Your email is associated with a tenant record, but it\'s linked to a different user account. Please contact your property manager.',
          code: 'EMAIL_MISMATCH'
        });
      }
      
      return res.status(404).json({ 
        message: 'No tenant record found. Your account exists, but you haven\'t been added to any property yet. Please contact your property manager to add you as a tenant.',
        code: 'NO_TENANT_RECORD',
        userEmail: req.user.email
      });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Get tenant info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all tenants for organization
router.get('/', auth, async (req, res) => {
  try {
    // If user is a tenant, only return their own info
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id })
        .populate('propertyId', 'propertyName')
        .populate('unitId', 'unitId rentAmount')
        .populate('organizationId', 'name');
      
      return res.json(tenant ? [tenant] : []);
    }

    // Admin can view all tenants or filter by organizationId
    const { propertyId, unitId, organizationId } = req.query;
    const query = req.user.role === 'admin' && organizationId
      ? { organizationId }
      : req.user.role === 'admin'
      ? {}
      : { organizationId: req.user.organizationId };
    
    if (propertyId) query.propertyId = propertyId;
    if (unitId) query.unitId = unitId;

    const tenants = await Tenant.find(query)
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId rentAmount')
      .populate('organizationId', 'name')
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(tenants);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single tenant
router.get('/:id', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    })
      .populate('propertyId')
      .populate('unitId')
      .populate('userId', 'email firstName lastName');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create tenant(s)
router.post('/', auth, requireRole('manager', 'landlord', 'admin'), upload.array('files', 10), async (req, res) => {
  try {
    const {
      propertyId,
      unitId,
      firstName,
      lastName,
      phoneNumber,
      deposit,
      accountNumber,
      nationalId,
      email,
      kraTaxPin,
      rentPaymentPenalty,
      notes,
      moveInDate,
      otherPhoneNumbers,
      leaseStartDate,
      leaseExpiryDate
    } = req.body;

    if (!propertyId || !unitId || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ 
        message: 'Property, unit, first name, last name, and phone number are required' 
      });
    }

    // Verify property and unit belong to organization
    const property = await Property.findOne({
      _id: propertyId,
      organizationId: req.user.organizationId
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const unit = await Unit.findOne({
      _id: unitId,
      propertyId: propertyId,
      organizationId: req.user.organizationId
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // Check if unit is already occupied
    if (unit.isOccupied) {
      return res.status(400).json({ message: 'Unit is already occupied' });
    }

    // Handle file uploads
    const uploadedFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path
    })) : [];

    // Parse deposit if provided
    let depositData = null;
    if (deposit) {
      try {
        depositData = typeof deposit === 'string' ? JSON.parse(deposit) : deposit;
      } catch (e) {
        depositData = deposit;
      }
    }

    // Parse other phone numbers
    let otherPhones = [];
    if (otherPhoneNumbers) {
      try {
        otherPhones = typeof otherPhoneNumbers === 'string' 
          ? JSON.parse(otherPhoneNumbers) 
          : Array.isArray(otherPhoneNumbers) 
            ? otherPhoneNumbers 
            : [];
      } catch (e) {
        otherPhones = [];
      }
    }

    // Try to link to existing user account, or create one with default password (254firstname)
    let linkedUserId = null;
    let tenantCreatedNewUser = false;
    const emailTrimmed = email ? email.toLowerCase().trim() : null;
    if (emailTrimmed) {
      let existingUser = await User.findOne({
        email: emailTrimmed,
        role: 'tenant'
      });
      if (existingUser) {
        linkedUserId = existingUser._id;
        const existingTenant = await Tenant.findOne({ userId: existingUser._id });
        if (existingTenant) {
          return res.status(400).json({
            message: 'This user account is already linked to another tenant record. Please use a different email or contact support.'
          });
        }
      } else {
        // Create a new user so the tenant can log in. Default password: 254 + firstName (e.g. 254John)
        const defaultPassword = '254' + (firstName || '').trim();
        if (defaultPassword.length <= 3) {
          return res.status(400).json({
            message: 'First name is required to generate tenant login credentials.'
          });
        }
        const newUser = new User({
          email: emailTrimmed,
          password: defaultPassword,
          role: 'tenant',
          firstName: (firstName || '').trim() || null,
          lastName: (lastName || '').trim() || null,
          phone: phoneNumber || null,
          isFirstTimeLogin: true,
          onboardingCompleted: false
        });
        await newUser.save();
        linkedUserId = newUser._id;
        tenantCreatedNewUser = true;
      }
    }

    const tenant = new Tenant({
      organizationId: req.user.organizationId,
      propertyId,
      unitId,
      userId: linkedUserId, // Link to user account if found
      firstName,
      lastName,
      phoneNumber,
      deposit: depositData,
      accountNumber: accountNumber || null,
      nationalId: nationalId || null,
      email: email || null,
      kraTaxPin: kraTaxPin || null,
      rentPaymentPenalty: rentPaymentPenalty || null,
      notes: notes || null,
      moveInDate: moveInDate || null,
      otherPhoneNumbers: otherPhones,
      leaseStartDate: leaseStartDate || null,
      leaseExpiryDate: leaseExpiryDate || null,
      uploadedFiles
    });

    await tenant.save();

    // Mark unit as occupied
    unit.isOccupied = true;
    await unit.save();

    const response = tenant.toObject();
    if (tenantCreatedNewUser && emailTrimmed) {
      response.initialLoginPassword = '254' + (firstName || '').trim();
      response.message = 'Tenant created. They can log in with their email and password: 254' + (firstName || '').trim();
    }
    res.status(201).json(response);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update tenant
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), upload.array('files', 10), async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path
      }));
      tenant.uploadedFiles = [...tenant.uploadedFiles, ...newFiles];
    }

    // Update other fields
    const updateFields = [
      'firstName', 'lastName', 'phoneNumber', 'deposit', 'accountNumber',
      'nationalId', 'email', 'kraTaxPin', 'rentPaymentPenalty', 'notes',
      'moveInDate', 'otherPhoneNumbers', 'leaseStartDate', 'leaseExpiryDate'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'deposit' && typeof req.body[field] === 'string') {
          try {
            tenant[field] = JSON.parse(req.body[field]);
          } catch (e) {
            tenant[field] = req.body[field];
          }
        } else if (field === 'otherPhoneNumbers' && typeof req.body[field] === 'string') {
          try {
            tenant[field] = JSON.parse(req.body[field]);
          } catch (e) {
            tenant[field] = req.body[field];
          }
        } else {
          tenant[field] = req.body[field];
        }
      }
    });

    await tenant.save();
    res.json(tenant);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete tenant
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Mark unit as unoccupied
    const unit = await Unit.findById(tenant.unitId);
    if (unit) {
      unit.isOccupied = false;
      await unit.save();
    }

    // Delete uploaded files
    if (tenant.uploadedFiles && tenant.uploadedFiles.length > 0) {
      tenant.uploadedFiles.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    await tenant.deleteOne();
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
