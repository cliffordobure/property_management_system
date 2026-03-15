const express = require('express');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);
router.use(requireRole('manager', 'landlord', 'admin'));

// Get all overdue items (payments, maintenance, etc.)
router.get('/all', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let organizationQuery = {};
    if (req.user.role !== 'admin') {
      organizationQuery.organizationId = req.user.organizationId;
    } else if (req.query.organizationId) {
      organizationQuery.organizationId = req.query.organizationId;
    }

    // Get overdue invoices (due date passed and status is not 'paid' or 'cancelled')
    const overdueInvoices = await Invoice.find({
      ...organizationQuery,
      dueDate: { $lt: today },
      status: { $in: ['open', 'overdue'] }
    })
      .populate('tenantId', 'firstName lastName phoneNumber email')
      .populate('propertyId', 'propertyName city')
      .populate('unitId', 'unitId')
      .sort({ dueDate: 1 });

    // Calculate paid amount for each invoice
    const invoicesWithPaidAmount = await Promise.all(
      overdueInvoices.map(async (invoice) => {
        const totalPayments = await Payment.aggregate([
          {
            $match: {
              invoiceId: invoice._id,
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const paidAmount = totalPayments.length > 0 ? totalPayments[0].total : 0;
        const amountOwed = invoice.total - paidAmount;

        return {
          ...invoice.toObject(),
          paidAmount,
          amountOwed
        };
      })
    );

    // Get overdue maintenance requests (scheduled date passed and status is not 'completed' or 'cancelled')
    const overdueMaintenance = await Maintenance.find({
      ...organizationQuery,
      scheduledDate: { $lt: today, $ne: null },
      status: { $in: ['pending', 'assigned', 'in_progress'] }
    })
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId')
      .populate('tenantId', 'firstName lastName')
      .sort({ scheduledDate: 1 });

    // Calculate overdue amounts
    const overdueAmount = invoicesWithPaidAmount.reduce((sum, invoice) => {
      return sum + invoice.amountOwed;
    }, 0);

    // Count overdue days for each invoice
    const invoicesWithOverdueDays = invoicesWithPaidAmount.map(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      return {
        ...invoice,
        daysOverdue
      };
    });

    // Count overdue days for maintenance
    const maintenanceWithOverdueDays = overdueMaintenance.map(maintenance => {
      const scheduledDate = new Date(maintenance.scheduledDate);
      const daysOverdue = Math.floor((today - scheduledDate) / (1000 * 60 * 60 * 24));
      return {
        ...maintenance.toObject(),
        daysOverdue
      };
    });

    res.json({
      summary: {
        totalOverdueInvoices: overdueInvoices.length,
        totalOverdueAmount: overdueAmount,
        totalOverdueMaintenance: overdueMaintenance.length
      },
      overdueInvoices: invoicesWithOverdueDays,
      overdueMaintenance: maintenanceWithOverdueDays
    });
  } catch (error) {
    console.error('Get overdue items error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get overdue payments (invoices past due date)
router.get('/payments', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let organizationQuery = {};
    if (req.user.role !== 'admin') {
      organizationQuery.organizationId = req.user.organizationId;
    } else if (req.query.organizationId) {
      organizationQuery.organizationId = req.query.organizationId;
    }

    const overdueInvoices = await Invoice.find({
      ...organizationQuery,
      dueDate: { $lt: today },
      status: { $in: ['open', 'overdue'] }
    })
      .populate('tenantId', 'firstName lastName phoneNumber email')
      .populate('propertyId', 'propertyName city location')
      .populate('unitId', 'unitId')
      .sort({ dueDate: 1 });

    // Calculate paid amount for each invoice
    const overdueDetails = await Promise.all(
      overdueInvoices.map(async (invoice) => {
        const totalPayments = await Payment.aggregate([
          {
            $match: {
              invoiceId: invoice._id,
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const paidAmount = totalPayments.length > 0 ? totalPayments[0].total : 0;
        const amountOwed = invoice.total - paidAmount;
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        return {
          ...invoice.toObject(),
          paidAmount,
          amountOwed,
          daysOverdue
        };
      })
    );

    const totalOverdue = overdueDetails.reduce((sum, inv) => sum + inv.amountOwed, 0);

    res.json({
      totalOverdue,
      count: overdueDetails.length,
      invoices: overdueDetails
    });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get overdue maintenance requests
router.get('/maintenance', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let organizationQuery = {};
    if (req.user.role !== 'admin') {
      organizationQuery.organizationId = req.user.organizationId;
    } else if (req.query.organizationId) {
      organizationQuery.organizationId = req.query.organizationId;
    }

    const overdueMaintenance = await Maintenance.find({
      ...organizationQuery,
      scheduledDate: { $lt: today, $ne: null },
      status: { $in: ['pending', 'assigned', 'in_progress'] }
    })
      .populate('propertyId', 'propertyName city location')
      .populate('unitId', 'unitId')
      .populate('tenantId', 'firstName lastName phoneNumber')
      .sort({ scheduledDate: 1 });

    // Calculate overdue details
    const maintenanceWithDetails = overdueMaintenance.map(maintenance => {
      const scheduledDate = new Date(maintenance.scheduledDate);
      const daysOverdue = Math.floor((today - scheduledDate) / (1000 * 60 * 60 * 24));

      return {
        ...maintenance.toObject(),
        daysOverdue
      };
    });

    res.json({
      count: maintenanceWithDetails.length,
      maintenance: maintenanceWithDetails
    });
  } catch (error) {
    console.error('Get overdue maintenance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
