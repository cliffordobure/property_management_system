const express = require('express');
const PreVisit = require('../models/PreVisit');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Organization = require('../models/Organization');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public endpoint: Book a pre-visit (for website visitors)
router.post('/public/book', async (req, res) => {
  try {
    const {
      propertyId,
      unitId,
      visitorName,
      visitorPhone,
      visitorEmail,
      requestedDate,
      requestedTime,
      preferredContactMethod,
      message
    } = req.body;

    if (!propertyId || !visitorName || !visitorPhone || !requestedDate || !requestedTime) {
      return res.status(400).json({ 
        message: 'Property ID, visitor name, phone, date, and time are required' 
      });
    }

    // Verify property exists and is verified
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!property.isVerified) {
      return res.status(403).json({ 
        message: 'This property is not yet verified and cannot accept pre-visit bookings' 
      });
    }

    // Verify unit if provided
    if (unitId) {
      const unit = await Unit.findOne({ _id: unitId, propertyId: propertyId });
      if (!unit) {
        return res.status(404).json({ message: 'Unit not found for this property' });
      }
    }

    // Check daily limit: max 4 pre-visits per day per visitor (by phone number)
    const visitDate = new Date(requestedDate);
    visitDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(visitDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const todayVisits = await PreVisit.countDocuments({
      visitorPhone: visitorPhone.trim(),
      requestedDate: {
        $gte: visitDate,
        $lt: nextDay
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (todayVisits >= 4) {
      return res.status(400).json({ 
        message: 'You have reached the maximum limit of 4 pre-visits per day. Please book for another day.' 
      });
    }

    // Check if visitor is a registered tenant
    let tenantId = null;
    let userId = null;
    if (visitorEmail) {
      const user = await User.findOne({ email: visitorEmail.toLowerCase().trim(), role: 'tenant' });
      if (user) {
        userId = user._id;
        const tenant = await Tenant.findOne({ userId: user._id });
        if (tenant) {
          tenantId = tenant._id;
        }
      }
    }

    const preVisit = new PreVisit({
      propertyId,
      unitId: unitId || null,
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim(),
      visitorEmail: visitorEmail ? visitorEmail.toLowerCase().trim() : null,
      tenantId,
      userId,
      requestedDate: visitDate,
      requestedTime: requestedTime.trim(),
      preferredContactMethod: preferredContactMethod || 'phone',
      message: message || null,
      status: 'pending'
    });

    await preVisit.save();

    // Notify landlord
    const organization = await Organization.findById(property.organizationId);
    if (organization && organization.ownerId) {
      const landlord = await User.findById(organization.ownerId);
      if (landlord) {
        const notification = new Notification({
          recipientId: landlord._id,
          recipientRole: landlord.role,
          type: 'previsit_requested',
          title: 'New Pre-Visit Request',
          message: `${visitorName} has requested a pre-visit for "${property.propertyName}" on ${new Date(requestedDate).toLocaleDateString()} at ${requestedTime}.`,
          relatedResourceType: 'previsit',
          relatedResourceId: preVisit._id,
          priority: 'medium'
        });
        await notification.save();
        
        preVisit.landlordNotified = true;
        preVisit.landlordNotifiedAt = new Date();
        await preVisit.save();
      }
    }

    res.status(201).json({
      message: 'Pre-visit request submitted successfully. The landlord will be notified.',
      preVisit
    });
  } catch (error) {
    console.error('Book pre-visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pre-visits for landlord/manager (authenticated)
router.get('/', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all pre-visits
      if (req.query.organizationId) {
        const properties = await Property.find({ organizationId: req.query.organizationId }).select('_id');
        query.propertyId = { $in: properties.map(p => p._id) };
      }
    } else {
      // Landlord/manager can only see pre-visits for their properties
      const properties = await Property.find({ organizationId: req.user.organizationId }).select('_id');
      query.propertyId = { $in: properties.map(p => p._id) };
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.propertyId) {
      query.propertyId = req.query.propertyId;
    }

    const preVisits = await PreVisit.find(query)
      .populate('propertyId', 'propertyName city location')
      .populate('unitId', 'unitId')
      .populate('tenantId', 'firstName lastName')
      .sort({ requestedDate: -1, requestedTime: -1 });

    res.json(preVisits);
  } catch (error) {
    console.error('Get pre-visits error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single pre-visit
router.get('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const preVisit = await PreVisit.findById(req.params.id)
      .populate('propertyId')
      .populate('unitId')
      .populate('tenantId')
      .populate('userId');

    if (!preVisit) {
      return res.status(404).json({ message: 'Pre-visit not found' });
    }

    // Verify access
    const property = await Property.findById(preVisit.propertyId);
    if (req.user.role !== 'admin' && property.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(preVisit);
  } catch (error) {
    console.error('Get pre-visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update pre-visit status (confirm, cancel, reject)
router.put('/:id/status', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { status, confirmedDate, confirmedTime, landlordNotes } = req.body;

    if (!['confirmed', 'cancelled', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const preVisit = await PreVisit.findById(req.params.id)
      .populate('propertyId');

    if (!preVisit) {
      return res.status(404).json({ message: 'Pre-visit not found' });
    }

    // Verify access
    const property = await Property.findById(preVisit.propertyId);
    if (req.user.role !== 'admin' && property.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    preVisit.status = status;
    if (status === 'confirmed' && confirmedDate && confirmedTime) {
      preVisit.confirmedDate = new Date(confirmedDate);
      preVisit.confirmedTime = confirmedTime;
    }
    if (landlordNotes) {
      preVisit.landlordNotes = landlordNotes;
    }

    await preVisit.save();

    // Notify visitor if confirmed (if they have email or are registered)
    if (status === 'confirmed' && (preVisit.visitorEmail || preVisit.userId)) {
      // You can add email notification here if needed
    }

    res.json({ message: 'Pre-visit status updated successfully', preVisit });
  } catch (error) {
    console.error('Update pre-visit status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pre-visits for tenant (their own bookings)
router.get('/tenant/my-bookings', auth, async (req, res) => {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Access denied. This endpoint is for tenants only.' });
    }

    const tenant = await Tenant.findOne({ userId: req.user._id });
    const query = {
      $or: [
        { userId: req.user._id },
        { tenantId: tenant ? tenant._id : null },
        { visitorEmail: req.user.email }
      ]
    };

    const preVisits = await PreVisit.find(query)
      .populate('propertyId', 'propertyName city location')
      .populate('unitId', 'unitId')
      .sort({ requestedDate: -1, requestedTime: -1 });

    res.json(preVisits);
  } catch (error) {
    console.error('Get tenant pre-visits error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
