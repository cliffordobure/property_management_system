const mongoose = require('mongoose');

const subscriptionInvoiceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  subscriptionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  planPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  totalUnits: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['open', 'paid', 'overdue', 'cancelled'],
    default: 'open'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paidDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate invoice number before saving
subscriptionInvoiceSchema.pre('validate', async function(next) {
  if (!this.invoiceNumber) {
    const org = await mongoose.model('Organization').findById(this.organizationId);
    const orgInitials = org?.name?.substring(0, 3).toUpperCase() || 'ORG';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.invoiceNumber = `SUB-${orgInitials}-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('SubscriptionInvoice', subscriptionInvoiceSchema);
