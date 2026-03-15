const express = require('express');
const Claim = require('../models/Claim');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all claims (for managers/admins or tenant's own claims)
router.get('/', auth, async (req, res) => {
  try {
    const { tenantId, propertyId, status, claimType, startDate, endDate } = req.query;
    
    let query = {};
    
    // If user is a tenant, only show their own claims
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
    } else {
      // Managers/admins can filter
      query.organizationId = req.user.organizationId;
      
      if (tenantId) query.tenantId = tenantId;
      if (propertyId) query.propertyId = propertyId;
    }
    
    if (status) query.status = status;
    if (claimType) query.claimType = claimType;
    if (startDate || endDate) {
      query.submittedDate = {};
      if (startDate) query.submittedDate.$gte = new Date(startDate);
      if (endDate) query.submittedDate.$lte = new Date(endDate);
    }

    const claims = await Claim.find(query)
      .populate('tenantId', 'firstName lastName email phoneNumber')
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId')
      .sort({ submittedDate: -1 });

    res.json(claims);
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single claim
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a tenant, ensure they can only see their own claims
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
    } else {
      query.organizationId = req.user.organizationId;
    }

    const claim = await Claim.findOne(query)
      .populate('tenantId')
      .populate('propertyId')
      .populate('unitId');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.json(claim);
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create claim (tenant can create)
router.post('/', auth, requireRole('tenant', 'manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { propertyId, unitId, claimType, subject, description, amount, currency } = req.body;

    if (!subject || !description || !claimType || !amount) {
      return res.status(400).json({ message: 'Subject, description, claim type, and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    let tenantId;
    let organizationId;
    let actualPropertyId = propertyId;
    let actualUnitId = unitId;

    // If user is a tenant, use their tenant record
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      tenantId = tenant._id;
      organizationId = tenant.organizationId;
      actualPropertyId = tenant.propertyId;
      actualUnitId = tenant.unitId;
    } else {
      // Manager/admin can create for a tenant
      if (!propertyId) {
        return res.status(400).json({ message: 'Property ID is required' });
      }
      
      const property = await Property.findOne({
        _id: propertyId,
        organizationId: req.user.organizationId
      });
      
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      organizationId = req.user.organizationId;
      
      if (req.body.tenantId) {
        tenantId = req.body.tenantId;
        const tenant = await Tenant.findOne({
          _id: tenantId,
          organizationId: organizationId,
          propertyId: propertyId
        });
        
        if (!tenant) {
          return res.status(404).json({ message: 'Tenant not found' });
        }
      } else {
        return res.status(400).json({ message: 'Tenant ID is required' });
      }
    }

    const claim = new Claim({
      organizationId: organizationId,
      tenantId: tenantId,
      propertyId: actualPropertyId,
      unitId: actualUnitId,
      claimType: claimType,
      subject: subject,
      description: description,
      amount: amount,
      currency: currency || 'KES',
      status: 'pending',
      submittedDate: new Date(),
      updates: [{
        status: 'pending',
        notes: 'Claim submitted',
        updatedBy: req.user.email || 'Tenant',
        updatedAt: new Date()
      }]
    });

    await claim.save();

    await claim.populate('tenantId', 'firstName lastName email phoneNumber');
    await claim.populate('propertyId', 'propertyName');
    await claim.populate('unitId', 'unitId');

    res.status(201).json(claim);
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update claim status (managers/admins only)
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { status, rejectionReason, approvalNotes, paymentMethod, paymentReference, notes } = req.body;

    const claim = await Claim.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const oldStatus = claim.status;

    if (status && status !== oldStatus) {
      claim.status = status;
      claim.updates.push({
        status: status,
        notes: notes || `Status changed from ${oldStatus} to ${status}`,
        updatedBy: req.user.email || 'Manager',
        updatedAt: new Date()
      });

      // Set dates based on status
      if (status === 'reviewing' && !claim.reviewedDate) {
        claim.reviewedDate = new Date();
      }
      if (status === 'approved') {
        claim.approvedDate = new Date();
        if (approvalNotes) claim.approvalNotes = approvalNotes;
      }
      if (status === 'paid') {
        claim.paidDate = new Date();
        if (paymentMethod) claim.paymentMethod = paymentMethod;
        if (paymentReference) claim.paymentReference = paymentReference;
      }
      if (status === 'rejected' && rejectionReason) {
        claim.rejectionReason = rejectionReason;
      }
    }

    await claim.save();

    await claim.populate('tenantId', 'firstName lastName email phoneNumber');
    await claim.populate('propertyId', 'propertyName');
    await claim.populate('unitId', 'unitId');

    res.json(claim);
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete claim
router.delete('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a tenant, they can only delete their own pending claims
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
      query.status = 'pending'; // Only pending claims can be deleted by tenants
    } else {
      query.organizationId = req.user.organizationId;
    }

    const claim = await Claim.findOneAndDelete(query);

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.json({ message: 'Claim deleted successfully' });
  } catch (error) {
    console.error('Delete claim error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
