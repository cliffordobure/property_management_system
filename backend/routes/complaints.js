const express = require('express');
const Complaint = require('../models/Complaint');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all complaints (for managers/admins or tenant's own complaints)
router.get('/', auth, async (req, res) => {
  try {
    const { tenantId, propertyId, status, category, startDate, endDate } = req.query;
    
    let query = {};
    
    // If user is a tenant, only show their own complaints
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
    } else {
      // Managers/admins can filter by tenant, property, etc.
      query.organizationId = req.user.organizationId;
      
      if (tenantId) query.tenantId = tenantId;
      if (propertyId) query.propertyId = propertyId;
    }
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.submittedDate = {};
      if (startDate) query.submittedDate.$gte = new Date(startDate);
      if (endDate) query.submittedDate.$lte = new Date(endDate);
    }

    const complaints = await Complaint.find(query)
      .populate('tenantId', 'firstName lastName email phoneNumber')
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId')
      .sort({ submittedDate: -1 });

    res.json(complaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single complaint
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a tenant, ensure they can only see their own complaints
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
    } else {
      query.organizationId = req.user.organizationId;
    }

    const complaint = await Complaint.findOne(query)
      .populate('tenantId')
      .populate('propertyId')
      .populate('unitId');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create complaint (tenant can create)
router.post('/', auth, requireRole('tenant', 'manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { propertyId, unitId, category, priority, subject, description } = req.body;

    if (!subject || !description || !category) {
      return res.status(400).json({ message: 'Subject, description, and category are required' });
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
      
      // If tenantId is provided, use it; otherwise require it
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

    const complaint = new Complaint({
      organizationId: organizationId,
      tenantId: tenantId,
      propertyId: actualPropertyId,
      unitId: actualUnitId,
      category: category,
      priority: priority || 'medium',
      subject: subject,
      description: description,
      status: 'pending',
      submittedDate: new Date(),
      updates: [{
        status: 'pending',
        notes: 'Complaint submitted',
        updatedBy: req.user.email || 'Tenant',
        updatedAt: new Date()
      }]
    });

    await complaint.save();

    await complaint.populate('tenantId', 'firstName lastName email phoneNumber');
    await complaint.populate('propertyId', 'propertyName');
    await complaint.populate('unitId', 'unitId');

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update complaint status (managers/admins only)
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { status, resolution, resolutionNotes, notes } = req.body;

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const oldStatus = complaint.status;

    if (status && status !== oldStatus) {
      complaint.status = status;
      complaint.updates.push({
        status: status,
        notes: notes || `Status changed from ${oldStatus} to ${status}`,
        updatedBy: req.user.email || 'Manager',
        updatedAt: new Date()
      });

      // Set dates based on status
      if (status === 'acknowledged' && !complaint.acknowledgedDate) {
        complaint.acknowledgedDate = new Date();
      }
      if (status === 'resolved') {
        complaint.resolvedDate = new Date();
        if (resolution) complaint.resolution = resolution;
        if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;
      }
    }

    await complaint.save();

    await complaint.populate('tenantId', 'firstName lastName email phoneNumber');
    await complaint.populate('propertyId', 'propertyName');
    await complaint.populate('unitId', 'unitId');

    res.json(complaint);
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete complaint
router.delete('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a tenant, they can only delete their own pending complaints
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
      query.status = 'pending'; // Only pending complaints can be deleted by tenants
    } else {
      query.organizationId = req.user.organizationId;
    }

    const complaint = await Complaint.findOneAndDelete(query);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
