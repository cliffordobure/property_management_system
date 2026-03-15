const express = require('express');
const Maintenance = require('../models/Maintenance');
const Expense = require('../models/Expense');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Tenant = require('../models/Tenant');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all maintenance requests
router.get('/', auth, async (req, res) => {
  try {
    const { propertyId, unitId, tenantId, status, category, priority, startDate, endDate } = req.query;
    let query = {};

    // If user is a tenant, only show their own maintenance requests
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
      query.organizationId = tenant.organizationId;
    } else {
      // Managers/admins can filter
      query.organizationId = req.user.organizationId;
      if (propertyId) query.propertyId = propertyId;
      if (unitId) query.unitId = unitId;
      if (tenantId) query.tenantId = tenantId;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.requestedDate = {};
      if (startDate) query.requestedDate.$gte = new Date(startDate);
      if (endDate) query.requestedDate.$lte = new Date(endDate);
    }

    const maintenanceRequests = await Maintenance.find(query)
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId')
      .populate('tenantId', 'firstName lastName email phoneNumber')
      .sort({ requestedDate: -1 });

    res.json(maintenanceRequests);
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single maintenance request
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // If user is a tenant, ensure they can only see their own maintenance requests
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
      query.organizationId = tenant.organizationId;
    } else {
      query.organizationId = req.user.organizationId;
    }

    const maintenance = await Maintenance.findOne(query)
      .populate('propertyId')
      .populate('unitId')
      .populate('tenantId');

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create maintenance request
router.post('/', auth, requireRole('manager', 'landlord', 'admin', 'tenant'), async (req, res) => {
  try {
    const {
      propertyId,
      unitId,
      tenantId,
      category,
      priority,
      title,
      description,
      scheduledDate,
      estimatedCost,
      notes,
      contractorInfo
    } = req.body;

    if (!propertyId || !category || !title || !description) {
      return res.status(400).json({ 
        message: 'Property ID, category, title, and description are required' 
      });
    }

    let organizationId = req.user.organizationId;
    let actualTenantId = tenantId;

    // If user is a tenant, get organizationId and tenantId from tenant record
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      organizationId = tenant.organizationId;
      actualTenantId = tenant._id;
      
      // Ensure the propertyId matches the tenant's property
      if (tenant.propertyId.toString() !== propertyId) {
        return res.status(403).json({ 
          message: 'You can only create maintenance requests for your assigned property' 
        });
      }
    }

    // Verify property belongs to organization (or tenant has access)
    const property = await Property.findOne({
      _id: propertyId,
      organizationId: organizationId
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Verify unit if provided
    if (unitId) {
      const unit = await Unit.findOne({
        _id: unitId,
        propertyId: propertyId,
        organizationId: organizationId
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }
    }

    // Verify tenant if provided
    if (tenantId) {
      const tenant = await Tenant.findOne({
        _id: tenantId,
        propertyId: propertyId,
        organizationId: organizationId
      });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
    }

    // Create maintenance request
    const maintenance = new Maintenance({
      organizationId: organizationId,
      propertyId: propertyId,
      unitId: unitId || null,
      tenantId: actualTenantId || tenantId || null,
      requestedDate: new Date(),
      category: category,
      priority: priority || 'medium',
      title: title,
      description: description,
      status: 'pending',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      estimatedCost: estimatedCost || null,
      notes: notes || null,
      contractorInfo: contractorInfo || null,
      updates: [{
        status: 'pending',
        notes: 'Maintenance request created',
        updatedBy: req.user.email || 'System',
        updatedAt: new Date()
      }]
    });

    await maintenance.save();

    // Populate maintenance for response
    await maintenance.populate('propertyId', 'propertyName');
    await maintenance.populate('unitId', 'unitId');
    await maintenance.populate('tenantId', 'firstName lastName email phoneNumber');

    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update maintenance request
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const maintenance = await Maintenance.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    const oldStatus = maintenance.status;
    const { status, notes, actualCost, ...updateData } = req.body;

    // Handle date fields
    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate);
    }
    if (updateData.completedDate) {
      updateData.completedDate = new Date(updateData.completedDate);
    }

    // Update actualCost if provided
    if (actualCost !== undefined) {
      maintenance.actualCost = actualCost;
    }

    Object.assign(maintenance, updateData);

    // If status changed, add update
    if (status && status !== oldStatus) {
      maintenance.status = status;
      maintenance.updates.push({
        status: status,
        notes: notes || `Status changed from ${oldStatus} to ${status}`,
        updatedBy: req.user.email || 'System',
        updatedAt: new Date()
      });

      // Set completed date if status is completed
      if (status === 'completed' && !maintenance.completedDate) {
        maintenance.completedDate = new Date();
      }
    }

    // If maintenance is completed and has actualCost, create or update expense automatically
    // Check this AFTER all updates are applied
    const shouldCreateExpense = maintenance.status === 'completed' && 
                                 maintenance.actualCost && 
                                 maintenance.actualCost > 0;
    
    if (shouldCreateExpense) {
      try {
        if (maintenance.expenseId) {
          // Update existing expense if actualCost changed
          const expense = await Expense.findById(maintenance.expenseId);
          if (expense) {
            expense.amount = maintenance.actualCost;
            expense.vendor = maintenance.contractorInfo?.name || expense.vendor;
            await expense.save();
            console.log(`Updated expense ${expense._id} for maintenance ${maintenance._id}`);
          } else {
            // Expense ID exists but expense not found, create new one
            maintenance.expenseId = null;
          }
        }
        
        // Create new expense if one doesn't exist
        if (!maintenance.expenseId) {
          const expense = new Expense({
            organizationId: maintenance.organizationId,
            propertyId: maintenance.propertyId,
            unitId: maintenance.unitId,
            expenseDate: maintenance.completedDate || new Date(),
            category: 'maintenance',
            description: `Maintenance: ${maintenance.title} - ${maintenance.description}`,
            amount: maintenance.actualCost,
            paymentMethod: 'cash', // Default, can be updated later
            vendor: maintenance.contractorInfo?.name || null,
            notes: `Auto-generated from maintenance request ${maintenance.requestNumber}. ${maintenance.notes || ''}`,
            maintenanceId: maintenance._id
          });

          await expense.save();
          maintenance.expenseId = expense._id;
          console.log(`Created expense ${expense._id} for maintenance ${maintenance._id} with amount ${maintenance.actualCost}`);
        }
      } catch (expenseError) {
        console.error('Error creating/updating expense from maintenance:', expenseError);
        console.error('Error details:', expenseError.message, expenseError.stack);
        // Don't fail the maintenance update if expense creation fails
      }
    }

    await maintenance.save();

    await maintenance.populate('propertyId', 'propertyName');
    await maintenance.populate('unitId', 'unitId');
    await maintenance.populate('tenantId', 'firstName lastName email phoneNumber');

    res.json(maintenance);
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add update to maintenance request
router.post('/:id/updates', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const maintenance = await Maintenance.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Update status if provided
    if (status && status !== maintenance.status) {
      maintenance.status = status;
      
      if (status === 'completed' && !maintenance.completedDate) {
        maintenance.completedDate = new Date();
      }
    }

    // Add update
    maintenance.updates.push({
      status: status || maintenance.status,
      notes: notes || '',
      updatedBy: req.user.email || 'System',
      updatedAt: new Date()
    });

    // If maintenance is completed and has actualCost, create or update expense automatically
    // Check this AFTER all updates are applied
    const shouldCreateExpense = maintenance.status === 'completed' && 
                                 maintenance.actualCost && 
                                 maintenance.actualCost > 0;
    
    if (shouldCreateExpense) {
      try {
        if (maintenance.expenseId) {
          // Update existing expense if actualCost changed
          const expense = await Expense.findById(maintenance.expenseId);
          if (expense) {
            expense.amount = maintenance.actualCost;
            expense.vendor = maintenance.contractorInfo?.name || expense.vendor;
            await expense.save();
            console.log(`Updated expense ${expense._id} for maintenance ${maintenance._id}`);
          } else {
            // Expense ID exists but expense not found, create new one
            maintenance.expenseId = null;
          }
        }
        
        // Create new expense if one doesn't exist
        if (!maintenance.expenseId) {
          const expense = new Expense({
            organizationId: maintenance.organizationId,
            propertyId: maintenance.propertyId,
            unitId: maintenance.unitId,
            expenseDate: maintenance.completedDate || new Date(),
            category: 'maintenance',
            description: `Maintenance: ${maintenance.title} - ${maintenance.description}`,
            amount: maintenance.actualCost,
            paymentMethod: 'cash', // Default, can be updated later
            vendor: maintenance.contractorInfo?.name || null,
            notes: `Auto-generated from maintenance request ${maintenance.requestNumber}. ${maintenance.notes || ''}`,
            maintenanceId: maintenance._id
          });

          await expense.save();
          maintenance.expenseId = expense._id;
          console.log(`Created expense ${expense._id} for maintenance ${maintenance._id} with amount ${maintenance.actualCost}`);
        }
      } catch (expenseError) {
        console.error('Error creating/updating expense from maintenance:', expenseError);
        console.error('Error details:', expenseError.message, expenseError.stack);
        // Don't fail the maintenance update if expense creation fails
      }
    }

    await maintenance.save();

    await maintenance.populate('propertyId', 'propertyName');
    await maintenance.populate('unitId', 'unitId');
    await maintenance.populate('tenantId', 'firstName lastName email phoneNumber');

    res.json(maintenance);
  } catch (error) {
    console.error('Add maintenance update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete maintenance request
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const maintenance = await Maintenance.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get maintenance statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { organizationId: req.user.organizationId };

    // Only apply date filter if both dates are provided
    if (startDate && endDate) {
      matchQuery.requestedDate = {};
      // Set to start of day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchQuery.requestedDate.$gte = start;
      
      // Set to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchQuery.requestedDate.$lte = end;
    }

    const stats = await Maintenance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$status'
            }
          },
          byCategory: {
            $push: {
              category: '$category'
            }
          },
          byPriority: {
            $push: {
              priority: '$priority'
            }
          },
          totalCost: { $sum: { $ifNull: ['$actualCost', 0] } }
        }
      }
    ]);

    // Calculate by status
    const byStatus = {};
    const byCategory = {};
    const byPriority = {};
    
    if (stats.length > 0) {
      if (stats[0].byStatus) {
        stats[0].byStatus.forEach(item => {
          byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        });
      }
      if (stats[0].byCategory) {
        stats[0].byCategory.forEach(item => {
          byCategory[item.category] = (byCategory[item.category] || 0) + 1;
        });
      }
      if (stats[0].byPriority) {
        stats[0].byPriority.forEach(item => {
          byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
        });
      }
    }

    res.json({
      totalRequests: stats.length > 0 ? stats[0].totalRequests : 0,
      totalCost: stats.length > 0 ? stats[0].totalCost : 0,
      byStatus: byStatus,
      byCategory: byCategory,
      byPriority: byPriority
    });
  } catch (error) {
    console.error('Get maintenance stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Retroactively create expenses for completed maintenance requests that have actualCost but no expense
router.post('/sync-expenses', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find({
      organizationId: req.user.organizationId,
      status: 'completed',
      actualCost: { $gt: 0 },
      $or: [
        { expenseId: null },
        { expenseId: { $exists: false } }
      ]
    });

    let created = 0;
    let errors = 0;

    for (const maintenance of maintenanceRequests) {
      try {
        const expense = new Expense({
          organizationId: maintenance.organizationId,
          propertyId: maintenance.propertyId,
          unitId: maintenance.unitId,
          expenseDate: maintenance.completedDate || maintenance.updatedAt || new Date(),
          category: 'maintenance',
          description: `Maintenance: ${maintenance.title} - ${maintenance.description}`,
          amount: maintenance.actualCost,
          paymentMethod: 'cash',
          vendor: maintenance.contractorInfo?.name || null,
          notes: `Auto-generated from maintenance request ${maintenance.requestNumber}. ${maintenance.notes || ''}`,
          maintenanceId: maintenance._id
        });

        await expense.save();
        maintenance.expenseId = expense._id;
        await maintenance.save();
        created++;
        console.log(`Created expense ${expense._id} for maintenance ${maintenance._id}`);
      } catch (error) {
        console.error(`Error creating expense for maintenance ${maintenance._id}:`, error);
        errors++;
      }
    }

    res.json({
      message: `Sync completed. Created ${created} expenses, ${errors} errors.`,
      created,
      errors,
      total: maintenanceRequests.length
    });
  } catch (error) {
    console.error('Sync expenses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
