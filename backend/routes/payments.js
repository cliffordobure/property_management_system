const express = require('express');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Tenant = require('../models/Tenant');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    const { tenantId, invoiceId, propertyId, startDate, endDate, status, paymentMethod } = req.query;
    let query = {};

    // If user is a tenant, only show their own payments
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
      if (tenantId) query.tenantId = tenantId;
      if (propertyId) query.propertyId = propertyId;
    }

    if (invoiceId) query.invoiceId = invoiceId;
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('invoiceId', 'invoiceNumber invoiceDate total status')
      .populate('tenantId', 'firstName lastName email phoneNumber')
      .populate('propertyId', 'propertyName')
      .sort({ paymentDate: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single payment
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // If user is a tenant, ensure they can only see their own payments
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

    const payment = await Payment.findOne(query)
      .populate('invoiceId')
      .populate('tenantId')
      .populate('propertyId');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create payment
router.post('/', auth, async (req, res) => {
  try {
    const {
      invoiceId,
      paymentDate,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
      receiptNumber
    } = req.body;

    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        message: 'Invoice ID, amount, and payment method are required' 
      });
    }

    // Build invoice query and get organizationId
    let invoiceQuery = { _id: invoiceId };
    let organizationId;

    // If user is a tenant, ensure they can only pay their own invoices
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found. Please contact support to link your account.' });
      }
      if (!tenant.organizationId) {
        return res.status(400).json({ message: 'Tenant account is not properly configured. Please contact support.' });
      }
      invoiceQuery.tenantId = tenant._id;
      invoiceQuery.organizationId = tenant.organizationId;
      organizationId = tenant.organizationId;
    } else {
      // Managers/admins can pay invoices in their organization
      if (!req.user.organizationId) {
        return res.status(400).json({ message: 'User account is not properly configured. Please contact support.' });
      }
      invoiceQuery.organizationId = req.user.organizationId;
      organizationId = req.user.organizationId;
    }

    // Get invoice
    const invoice = await Invoice.findOne(invoiceQuery)
      .populate('tenantId')
      .populate('propertyId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found or you do not have permission to pay this invoice.' });
    }

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is missing. Please contact support.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }

    // Validate amount is a number
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount)) {
      return res.status(400).json({ message: 'Payment amount must be a valid number' });
    }

    // Determine payment status: pending for tenants, completed for managers/landlords
    const paymentStatus = req.user.role === 'tenant' ? 'pending' : 'completed';

    // Check for duplicate pending payments (same invoice, amount, method, and status) within last 5 minutes
    // This prevents accidental duplicate submissions from double-clicks or form resubmissions
    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Normalize dates to compare just the date part (ignore time for date comparison)
    const normalizedPaymentDate = new Date(paymentDateObj);
    normalizedPaymentDate.setHours(0, 0, 0, 0);

    const existingPendingPayment = await Payment.findOne({
      invoiceId: invoice._id,
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      status: paymentStatus,
      organizationId: organizationId,
      createdAt: { $gte: fiveMinutesAgo } // Only check recent duplicates (last 5 minutes)
    });

    if (existingPendingPayment) {
      return res.status(400).json({ 
        message: `A duplicate ${paymentStatus} payment with the same details was submitted recently. Please check your payment history or wait for approval before submitting again.` 
      });
    }

    // Create payment
    const payment = new Payment({
      organizationId: organizationId,
      invoiceId: invoice._id,
      tenantId: invoice.tenantId?._id || invoice.tenantId,
      propertyId: invoice.propertyId?._id || invoice.propertyId,
      paymentDate: paymentDate || new Date(),
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      receiptNumber: receiptNumber || null,
      status: paymentStatus
    });

    await payment.save();

    // Calculate total completed payments for this invoice (for response)
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

    // Only update invoice status if payment is completed (not pending)
    // Pending payments will update invoice status when approved
    if (paymentStatus === 'completed') {
      // Update invoice status based on payment
      if (paidAmount >= invoice.total) {
        invoice.status = 'paid';
      } else if (paidAmount > 0) {
        invoice.status = 'open'; // Still has balance
      }

      await invoice.save();

      // Auto-generate receipt for completed payments
      try {
        const { generateReceipt } = require('../utils/paymentVerification');
        await generateReceipt(payment);
        // Refresh payment to get receipt number
        await payment.populate('invoiceId tenantId propertyId');
      } catch (receiptError) {
        console.error('Error generating receipt:', receiptError);
        // Don't fail the payment creation if receipt generation fails
      }
    }

    // Populate payment for response
    await payment.populate('invoiceId', 'invoiceNumber invoiceDate total status');
    await payment.populate('tenantId', 'firstName lastName email phoneNumber');
    await payment.populate('propertyId', 'propertyName');

    res.status(201).json({
      payment: payment,
      invoiceUpdated: invoice.status,
      paidAmount: paidAmount,
      remainingBalance: invoice.total - paidAmount
    });
  } catch (error) {
    console.error('Create payment error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ 
        message: 'Validation error', 
        error: errorMessages 
      });
    }
    
    // Handle other errors
    return res.status(500).json({ 
      message: 'Failed to create payment', 
      error: error.message || 'An unexpected error occurred. Please try again or contact support.' 
    });
  }
});

// Update payment
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const oldAmount = payment.amount;
    Object.assign(payment, req.body);
    await payment.save();

    // If amount changed, recalculate invoice status
    if (req.body.amount && req.body.amount !== oldAmount) {
      const invoice = await Invoice.findById(payment.invoiceId);
      if (invoice) {
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

        if (paidAmount >= invoice.total) {
          invoice.status = 'paid';
        } else if (paidAmount > 0) {
          invoice.status = 'open';
        }

        await invoice.save();
      }
    }

    await payment.populate('invoiceId');
    await payment.populate('tenantId');
    await payment.populate('propertyId');

    res.json(payment);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete payment
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const invoiceId = payment.invoiceId;

    await Payment.findByIdAndDelete(payment._id);

    // Recalculate invoice status after payment deletion
    const invoice = await Invoice.findById(invoiceId);
    if (invoice) {
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

      if (paidAmount >= invoice.total) {
        invoice.status = 'paid';
      } else if (paidAmount > 0) {
        invoice.status = 'open';
      } else {
        invoice.status = 'open'; // No payments, back to open
      }

      await invoice.save();
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve payment (for landlords/managers)
router.put('/:id/approve', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    }).populate('invoiceId');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment cannot be approved. Current status: ${payment.status}` });
    }

    // Update payment status to completed
    payment.status = 'completed';
    await payment.save();

    // Update invoice status based on all completed payments
    const invoice = await Invoice.findById(payment.invoiceId._id || payment.invoiceId);
    if (invoice) {
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

      // Update invoice status based on payment
      if (paidAmount >= invoice.total) {
        invoice.status = 'paid';
      } else if (paidAmount > 0) {
        invoice.status = 'open'; // Still has balance
      }

      await invoice.save();
    }

    // Populate payment for response
    await payment.populate('invoiceId', 'invoiceNumber invoiceDate total status');
    await payment.populate('tenantId', 'firstName lastName email phoneNumber');
    await payment.populate('propertyId', 'propertyName');

    res.json({
      payment: payment,
      message: 'Payment approved successfully',
      invoiceUpdated: invoice?.status
    });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject payment (for landlords/managers)
router.put('/:id/reject', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment cannot be rejected. Current status: ${payment.status}` });
    }

    // Update payment status to failed (rejected)
    payment.status = 'failed';
    await payment.save();

    // Populate payment for response
    await payment.populate('invoiceId', 'invoiceNumber invoiceDate total status');
    await payment.populate('tenantId', 'firstName lastName email phoneNumber');
    await payment.populate('propertyId', 'propertyName');

    res.json({
      payment: payment,
      message: 'Payment rejected'
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { organizationId: req.user.organizationId, status: 'completed' };

    if (startDate || endDate) {
      matchQuery.paymentDate = {};
      if (startDate) matchQuery.paymentDate.$gte = new Date(startDate);
      if (endDate) matchQuery.paymentDate.$lte = new Date(endDate);
    }

    const stats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          byMethod: {
            $push: {
              method: '$paymentMethod',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    // Calculate by payment method
    const byMethod = {};
    if (stats.length > 0 && stats[0].byMethod) {
      stats[0].byMethod.forEach(item => {
        if (!byMethod[item.method]) {
          byMethod[item.method] = 0;
        }
        byMethod[item.method] += item.amount;
      });
    }

    res.json({
      totalAmount: stats.length > 0 ? stats[0].totalAmount : 0,
      count: stats.length > 0 ? stats[0].count : 0,
      byMethod: byMethod
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
