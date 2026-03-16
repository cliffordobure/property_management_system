const express = require('express');
const Unit = require('../models/Unit');
const Property = require('../models/Property');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public route: Get available units for landing page (no auth required)
// Show units from: (1) admin-verified full_management properties, (2) advertise_only properties with paid listing fee
router.get('/public/available', async (req, res) => {
  try {
    const { country, city, location, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Properties that can be shown: verified full_management OR advertise_only with listing fee paid
    const propertyQuery = {
      $or: [
        { isVerified: true },
        { listingType: 'advertise_only', listingFeeStatus: 'paid' }
      ]
    };
    
    // Handle country filter: match exact or include properties without country (treat as Kenya)
    if (country && country.trim()) {
      const countryLower = country.trim().toLowerCase();
      if (countryLower === 'kenya') {
        // For Kenya, include properties without country field or with country = Kenya
        propertyQuery.$or = [
          { country: new RegExp('kenya', 'i') },
          { country: { $exists: false } },
          { country: null }
        ];
      } else {
        // For other countries, match exact
        propertyQuery.country = new RegExp(country.trim(), 'i');
      }
    }
    
    if (city && city.trim()) {
      propertyQuery.city = new RegExp(city.trim(), 'i');
    }
    
    if (location && location.trim()) {
      propertyQuery.location = new RegExp(location.trim(), 'i');
    }

    // Find properties matching the filters
    const properties = await Property.find(propertyQuery).select('_id');
    const propertyIds = properties.map(p => p._id);

    if (propertyIds.length === 0) {
      return res.json({
        units: [],
        total: 0,
        page: parseInt(page),
        totalPages: 0,
        hasMore: false
      });
    }

    // Find available units (not occupied)
    const query = {
      propertyId: { $in: propertyIds },
      isOccupied: false
    };

    const total = await Unit.countDocuments(query);
    const units = await Unit.find(query)
      .populate('propertyId', 'propertyName country city location streetName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      units,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + units.length < total
    });
  } catch (error) {
    console.error('Get available units error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all units for organization
router.get('/', auth, async (req, res) => {
  try {
    const { propertyId } = req.query;
    const query = { organizationId: req.user.organizationId };
    
    if (propertyId) {
      query.propertyId = propertyId;
    }

    const units = await Unit.find(query)
      .populate('propertyId', 'propertyName')
      .sort({ createdAt: -1 });
    
    res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single unit
router.get('/:id', auth, async (req, res) => {
  try {
    const unit = await Unit.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    }).populate('propertyId');

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    res.json(unit);
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create unit
router.post('/', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { propertyId, unitId, rentAmount, taxRate, otherRecurringBills, notes } = req.body;

    if (!propertyId || !unitId || rentAmount === undefined) {
      return res.status(400).json({ message: 'Property, unit ID, and rent amount are required' });
    }

    // Verify property belongs to organization
    const property = await Property.findOne({
      _id: propertyId,
      organizationId: req.user.organizationId
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if unit ID already exists in this property
    const existingUnit = await Unit.findOne({
      propertyId,
      unitId,
      organizationId: req.user.organizationId
    });

    if (existingUnit) {
      return res.status(400).json({ message: 'Unit ID already exists in this property' });
    }

    // Inherit recurring bills from property if not provided
    let recurringBills = otherRecurringBills || [];
    if (recurringBills.length === 0 && property.otherRecurringBills) {
      recurringBills = property.otherRecurringBills.map(bill => ({
        name: bill.name,
        amount: bill.amount
      }));
    }

    const unit = new Unit({
      propertyId,
      organizationId: req.user.organizationId,
      unitId,
      rentAmount,
      taxRate: taxRate || null,
      otherRecurringBills: recurringBills,
      notes: notes || null
    });

    await unit.save();
    res.status(201).json(unit);
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update unit
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const unit = await Unit.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    Object.assign(unit, req.body);
    await unit.save();

    res.json(unit);
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete unit
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const unit = await Unit.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
