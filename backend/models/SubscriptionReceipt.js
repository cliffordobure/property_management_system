const mongoose = require('mongoose');

const subscriptionReceiptSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  subscriptionInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionInvoice',
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
    enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'other'],
    required: true
  },
  referenceNumber: {
    type: String,
    default: null,
    trim: true
  },
  notes: {
    type: String,
    default: null
  },
  sentToLandlord: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate receipt number before saving
subscriptionReceiptSchema.pre('validate', async function(next) {
  if (!this.receiptNumber) {
    const org = await mongoose.model('Organization').findById(this.organizationId);
    const orgInitials = org?.name?.substring(0, 3).toUpperCase() || 'ORG';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.receiptNumber = `RCP-${orgInitials}-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('SubscriptionReceipt', subscriptionReceiptSchema);
