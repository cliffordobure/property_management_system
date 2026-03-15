const express = require('express');
const Utility = require('../models/Utility');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all utilities
router.get('/', auth, async (req, res) => {
  try {
    const { propertyId, unitId, utilityType, status, startDate, endDate } = req.query;
    const query = { organizationId: req.user.organizationId };

    if (propertyId) query.propertyId = propertyId;
    if (unitId) query.unitId = unitId;
    if (utilityType) query.utilityType = utilityType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query['billingPeriod.startDate'] = {};
      if (startDate) query['billingPeriod.startDate'].$gte = new Date(startDate);
      if (endDate) query['billingPeriod.startDate'].$lte = new Date(endDate);
    }

    const utilities = await Utility.find(query)
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId')
      .sort({ 'billingPeriod.startDate': -1 });

    res.json(utilities);
  } catch (error) {
    console.error('Get utilities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single utility
router.get('/:id', auth, async (req, res) => {
  try {
    const utility = await Utility.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    })
      .populate('propertyId')
      .populate('unitId');

    if (!utility) {
      return res.status(404).json({ message: 'Utility not found' });
    }

    res.json(utility);
  } catch (error) {
    console.error('Get utility error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create utility
router.post('/', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const {
      propertyId,
      unitId,
      utilityType,
      billingPeriod,
      meterReading,
      rate,
      amount,
      dueDate,
      accountNumber,
      referenceNumber,
      notes
    } = req.body;

    if (!propertyId || !utilityType || !amount || !billingPeriod) {
      return res.status(400).json({ 
        message: 'Property ID, utility type, amount, and billing period are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Utility amount must be greater than 0' });
    }

    // Verify property belongs to organization
    const property = await Property.findOne({
      _id: propertyId,
      organizationId: req.user.organizationId
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Verify unit if provided
    if (unitId) {
      const unit = await Unit.findOne({
        _id: unitId,
        propertyId: propertyId,
        organizationId: req.user.organizationId
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }
    }

    // Create utility
    const utility = new Utility({
      organizationId: req.user.organizationId,
      propertyId: propertyId,
      unitId: unitId || null,
      utilityType: utilityType,
      billingPeriod: {
        startDate: new Date(billingPeriod.startDate),
        endDate: new Date(billingPeriod.endDate)
      },
      meterReading: meterReading || null,
      rate: rate || null,
      amount: amount,
      dueDate: dueDate ? new Date(dueDate) : null,
      accountNumber: accountNumber || null,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      status: 'pending'
    });

    await utility.save();

    // Populate utility for response
    await utility.populate('propertyId', 'propertyName');
    await utility.populate('unitId', 'unitId');

    res.status(201).json(utility);
  } catch (error) {
    console.error('Create utility error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update utility
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const utility = await Utility.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!utility) {
      return res.status(404).json({ message: 'Utility not found' });
    }

    // Handle billing period update
    if (req.body.billingPeriod) {
      req.body.billingPeriod = {
        startDate: new Date(req.body.billingPeriod.startDate),
        endDate: new Date(req.body.billingPeriod.endDate)
      };
    }

    // Handle date fields
    if (req.body.dueDate) {
      req.body.dueDate = new Date(req.body.dueDate);
    }
    if (req.body.paidDate) {
      req.body.paidDate = new Date(req.body.paidDate);
    }

    Object.assign(utility, req.body);
    await utility.save();

    await utility.populate('propertyId', 'propertyName');
    await utility.populate('unitId', 'unitId');

    res.json(utility);
  } catch (error) {
    console.error('Update utility error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark utility as paid
router.put('/:id/mark-paid', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const utility = await Utility.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!utility) {
      return res.status(404).json({ message: 'Utility not found' });
    }

    utility.status = 'paid';
    utility.paidDate = new Date();
    await utility.save();

    await utility.populate('propertyId', 'propertyName');
    await utility.populate('unitId', 'unitId');

    res.json(utility);
  } catch (error) {
    console.error('Mark utility paid error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete utility
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const utility = await Utility.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!utility) {
      return res.status(404).json({ message: 'Utility not found' });
    }

    res.json({ message: 'Utility deleted successfully' });
  } catch (error) {
    console.error('Delete utility error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get utility statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { organizationId: req.user.organizationId };

    if (startDate || endDate) {
      matchQuery['billingPeriod.startDate'] = {};
      if (startDate) matchQuery['billingPeriod.startDate'].$gte = new Date(startDate);
      if (endDate) matchQuery['billingPeriod.startDate'].$lte = new Date(endDate);
    }

    const stats = await Utility.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
            }
          },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'overdue'] }, '$amount', 0]
            }
          },
          count: { $sum: 1 },
          byType: {
            $push: {
              type: '$utilityType',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    // Calculate by utility type
    const byType = {};
    if (stats.length > 0 && stats[0].byType) {
      stats[0].byType.forEach(item => {
        if (!byType[item.type]) {
          byType[item.type] = 0;
        }
        byType[item.type] += item.amount;
      });
    }

    res.json({
      totalAmount: stats.length > 0 ? stats[0].totalAmount : 0,
      paidAmount: stats.length > 0 ? stats[0].paidAmount : 0,
      pendingAmount: stats.length > 0 ? stats[0].pendingAmount : 0,
      overdueAmount: stats.length > 0 ? stats[0].overdueAmount : 0,
      count: stats.length > 0 ? stats[0].count : 0,
      byType: byType
    });
  } catch (error) {
    console.error('Get utility stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
