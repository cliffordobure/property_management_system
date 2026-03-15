const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    unique: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  receiptDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'other', 'manual'],
    required: true
  },
  referenceNumber: {
    type: String,
    default: null,
    trim: true
  },
  // Receipt details
  tenantName: {
    type: String,
    required: true
  },
  tenantPhone: {
    type: String,
    default: null
  },
  propertyName: {
    type: String,
    default: null
  },
  unitId: {
    type: String,
    default: null
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  // Receipt status
  sentToTenant: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: null
  },
  sentVia: {
    type: String,
    enum: ['email', 'sms', 'both', 'none'],
    default: 'none'
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate receipt number before saving
receiptSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const org = await mongoose.model('Organization').findById(this.organizationId);
    const orgInitials = org?.name?.substring(0, 3).toUpperCase() || 'ORG';
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    const count = await mongoose.model('Receipt').countDocuments({
      organizationId: this.organizationId,
      receiptDate: {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
    });
    const receiptNum = (count + 1).toString().padStart(4, '0');
    this.receiptNumber = `RCP-${orgInitials}-${year}${month}${day}-${receiptNum}`;
  }
  next();
});

module.exports = mongoose.model('Receipt', receiptSchema);
