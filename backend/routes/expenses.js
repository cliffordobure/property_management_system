const express = require('express');
const Expense = require('../models/Expense');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    const { propertyId, unitId, category, startDate, endDate, paymentMethod } = req.query;
    const query = { organizationId: req.user.organizationId };

    if (propertyId) query.propertyId = propertyId;
    if (unitId) query.unitId = unitId;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId')
      .sort({ expenseDate: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single expense
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    })
      .populate('propertyId')
      .populate('unitId');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create expense
router.post('/', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const {
      propertyId,
      unitId,
      expenseDate,
      category,
      description,
      amount,
      paymentMethod,
      vendor,
      referenceNumber,
      receiptNumber,
      notes
    } = req.body;

    if (!description || !amount || !category) {
      return res.status(400).json({ 
        message: 'Description, amount, and category are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Expense amount must be greater than 0' });
    }

    // Create expense
    const expense = new Expense({
      organizationId: req.user.organizationId,
      propertyId: propertyId || null,
      unitId: unitId || null,
      expenseDate: expenseDate || new Date(),
      category: category,
      description: description,
      amount: amount,
      paymentMethod: paymentMethod || 'cash',
      vendor: vendor || null,
      referenceNumber: referenceNumber || null,
      receiptNumber: receiptNumber || null,
      notes: notes || null
    });

    await expense.save();

    // Populate expense for response
    await expense.populate('propertyId', 'propertyName');
    await expense.populate('unitId', 'unitId');

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update expense
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    Object.assign(expense, req.body);
    await expense.save();

    await expense.populate('propertyId', 'propertyName');
    await expense.populate('unitId', 'unitId');

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete expense
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get expense statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { organizationId: req.user.organizationId };

    if (startDate || endDate) {
      matchQuery.expenseDate = {};
      if (startDate) matchQuery.expenseDate.$gte = new Date(startDate);
      if (endDate) matchQuery.expenseDate.$lte = new Date(endDate);
    }

    const stats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          byCategory: {
            $push: {
              category: '$category',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    // Calculate by category
    const byCategory = {};
    if (stats.length > 0 && stats[0].byCategory) {
      stats[0].byCategory.forEach(item => {
        if (!byCategory[item.category]) {
          byCategory[item.category] = 0;
        }
        byCategory[item.category] += item.amount;
      });
    }

    res.json({
      totalAmount: stats.length > 0 ? stats[0].totalAmount : 0,
      count: stats.length > 0 ? stats[0].count : 0,
      byCategory: byCategory
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
