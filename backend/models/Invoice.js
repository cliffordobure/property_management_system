const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null // null if generated for all tenants
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    default: null
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
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'paid', 'overdue', 'cancelled'],
    default: 'open'
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    default: null
  },
  combineWithOtherInvoices: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: null
  }
}, {
  timestamps: true
});

// Note: Invoice number is now generated in routes using property name initials
// This pre-validate hook is kept as fallback but shouldn't be used
invoiceSchema.pre('validate', async function(next) {
  if (!this.invoiceNumber) {
    // Fallback: Generate basic invoice number if not set
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.invoiceNumber = `INV-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
