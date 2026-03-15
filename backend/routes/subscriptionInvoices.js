const express = require('express');
const SubscriptionInvoice = require('../models/SubscriptionInvoice');
const SubscriptionReceipt = require('../models/SubscriptionReceipt');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Organization = require('../models/Organization');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// Helper function to calculate pricing based on number of units (same as in properties.js)
const calculatePricing = async (numberOfUnits) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ price: 1 });
    
    let selectedPlan = null;
    for (const plan of plans) {
      const maxUnits = plan.features?.maxUnits;
      if (maxUnits === null || maxUnits === undefined) {
        if (!selectedPlan) selectedPlan = plan;
      } else if (numberOfUnits <= maxUnits) {
        selectedPlan = plan;
        break;
      }
    }
    
    if (!selectedPlan && plans.length > 0) {
      selectedPlan = plans[plans.length - 1];
    }
    
    return selectedPlan;
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return null;
  }
};

// All routes require authentication
router.use(auth);

// Get all subscription invoices (Admin only)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { organizationId, status, startDate, endDate } = req.query;
    let query = {};

    if (organizationId) query.organizationId = organizationId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await SubscriptionInvoice.find(query)
      .populate('organizationId', 'name ownerId')
      .populate('subscriptionPlanId')
      .populate('organizationId.ownerId', 'firstName lastName email')
      .sort({ invoiceDate: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Get subscription invoices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get subscription invoices for organization (Landlord/Manager)
router.get('/my-invoices', requireRole('landlord', 'manager'), async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.status(400).json({ message: 'Organization not found' });
    }

    const invoices = await SubscriptionInvoice.find({ organizationId: req.user.organizationId })
      .populate('subscriptionPlanId')
      .sort({ invoiceDate: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Get my subscription invoices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate subscription invoice for organization (Admin only)
router.post('/generate', requireRole('admin'), async (req, res) => {
  try {
    const { organizationId, billingPeriod, periodStart, periodEnd } = req.body;

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const organization = await Organization.findById(organizationId)
      .populate('ownerId', 'firstName lastName email');

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Calculate total units for this organization
    const properties = await Property.find({ 
      organizationId: organizationId,
      isVerified: true 
    });
    const totalUnits = properties.reduce((sum, prop) => sum + (prop.numberOfUnits || 0), 0);

    if (totalUnits === 0) {
      return res.status(400).json({ message: 'Organization has no units. Cannot generate invoice.' });
    }

    // Calculate pricing based on total units
    const plan = await calculatePricing(totalUnits);
    if (!plan) {
      return res.status(400).json({ message: 'Unable to determine subscription plan' });
    }

    // Calculate period dates
    const startDate = periodStart ? new Date(periodStart) : new Date();
    const endDate = periodEnd ? new Date(periodEnd) : (() => {
      const end = new Date(startDate);
      if (billingPeriod === 'monthly') {
        end.setMonth(end.getMonth() + 1);
      } else if (billingPeriod === 'quarterly') {
        end.setMonth(end.getMonth() + 3);
      } else if (billingPeriod === 'yearly') {
        end.setFullYear(end.getFullYear() + 1);
      }
      return end;
    })();

    const dueDate = new Date(endDate);
    dueDate.setDate(dueDate.getDate() + 7); // 7 days after period end

    // Check if invoice already exists for this period
    const existingInvoice = await SubscriptionInvoice.findOne({
      organizationId: organizationId,
      periodStart: startDate,
      periodEnd: endDate,
      status: { $in: ['open', 'paid'] }
    });

    if (existingInvoice) {
      return res.status(400).json({ 
        message: 'Invoice already exists for this billing period',
        invoice: existingInvoice
      });
    }

    // Create subscription invoice
    const invoice = new SubscriptionInvoice({
      organizationId: organizationId,
      subscriptionPlanId: plan._id,
      billingPeriod: billingPeriod || plan.billingPeriod || 'monthly',
      periodStart: startDate,
      periodEnd: endDate,
      dueDate: dueDate,
      planName: plan.name,
      planPrice: plan.price,
      currency: plan.currency || 'KES',
      totalUnits: totalUnits,
      status: 'open'
    });

    await invoice.save();

    // Log invoice generation
    await logAction({
      action: 'Subscription Invoice Generated',
      category: 'subscription',
      user: req.user,
      organizationId: organizationId,
      resourceType: 'SubscriptionInvoice',
      resourceId: invoice._id,
      details: `Subscription invoice generated for ${organization.name}: ${plan.name} plan (${totalUnits} units)`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Generate subscription invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get receipts (Admin only) - Must be before /:invoiceId/pay to avoid route conflicts
router.get('/receipts', requireRole('admin'), async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;
    let query = {};

    if (organizationId) query.organizationId = organizationId;
    if (startDate || endDate) {
      query.receiptDate = {};
      if (startDate) query.receiptDate.$gte = new Date(startDate);
      if (endDate) query.receiptDate.$lte = new Date(endDate);
    }

    const receipts = await SubscriptionReceipt.find(query)
      .populate('organizationId', 'name ownerId')
      .populate('subscriptionInvoiceId', 'invoiceNumber planName')
      .populate('organizationId.ownerId', 'firstName lastName email')
      .sort({ receiptDate: -1 });

    res.json(receipts);
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark receipt as sent to landlord (Admin only)
router.put('/receipts/:id/mark-sent', requireRole('admin'), async (req, res) => {
  try {
    const receipt = await SubscriptionReceipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    receipt.sentToLandlord = true;
    receipt.sentAt = new Date();
    await receipt.save();

    res.json({ message: 'Receipt marked as sent', receipt });
  } catch (error) {
    console.error('Mark receipt sent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get receipts (Admin only) - Must be before /:invoiceId/pay to avoid route conflicts
router.get('/receipts', requireRole('admin'), async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;
    let query = {};

    if (organizationId) query.organizationId = organizationId;
    if (startDate || endDate) {
      query.receiptDate = {};
      if (startDate) query.receiptDate.$gte = new Date(startDate);
      if (endDate) query.receiptDate.$lte = new Date(endDate);
    }

    const receipts = await SubscriptionReceipt.find(query)
      .populate('organizationId', 'name ownerId')
      .populate('subscriptionInvoiceId', 'invoiceNumber planName')
      .populate('organizationId.ownerId', 'firstName lastName email')
      .sort({ receiptDate: -1 });

    res.json(receipts);
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark receipt as sent to landlord (Admin only)
router.put('/receipts/:id/mark-sent', requireRole('admin'), async (req, res) => {
  try {
    const receipt = await SubscriptionReceipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    receipt.sentToLandlord = true;
    receipt.sentAt = new Date();
    await receipt.save();

    res.json({ message: 'Receipt marked as sent', receipt });
  } catch (error) {
    console.error('Mark receipt sent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record subscription payment and generate receipt (Admin only)
router.post('/:invoiceId/pay', requireRole('admin'), async (req, res) => {
  try {
    const { amount, paymentMethod, referenceNumber, notes } = req.body;

    const invoice = await SubscriptionInvoice.findById(req.params.invoiceId)
      .populate('organizationId', 'name ownerId')
      .populate('subscriptionPlanId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice is already paid' });
    }

    const paymentAmount = parseFloat(amount) || invoice.planPrice;

    // Create receipt
    const receipt = new SubscriptionReceipt({
      organizationId: invoice.organizationId._id,
      subscriptionInvoiceId: invoice._id,
      amount: paymentAmount,
      currency: invoice.currency,
      paymentMethod: paymentMethod || 'mpesa',
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      sentToLandlord: false
    });

    await receipt.save();

    // Update invoice
    invoice.paidAmount = paymentAmount;
    invoice.paidDate = new Date();
    invoice.status = 'paid';
    if (notes) invoice.notes = notes;
    await invoice.save();

    // Update organization subscription plan
    const organization = await Organization.findById(invoice.organizationId._id);
    if (organization) {
      organization.subscriptionPlan = invoice.planName;
      await organization.save();
    }

    // Log payment
    await logAction({
      action: 'Subscription Payment Recorded',
      category: 'subscription',
      user: req.user,
      organizationId: invoice.organizationId._id,
      resourceType: 'SubscriptionReceipt',
      resourceId: receipt._id,
      details: `Subscription payment recorded: ${paymentAmount} ${invoice.currency} for ${organization.name}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      message: 'Payment recorded and receipt generated',
      invoice,
      receipt
    });
  } catch (error) {
    console.error('Record subscription payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
