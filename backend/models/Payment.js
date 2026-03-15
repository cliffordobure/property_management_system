const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
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
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'other', 'manual'],
    required: true,
    default: 'mpesa'
  },
  referenceNumber: {
    type: String,
    default: null,
    trim: true,
    index: true // Index for faster lookups
  },
  notes: {
    type: String,
    default: null
  },
  receiptNumber: {
    type: String,
    default: null,
    trim: true,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'verified'],
    default: 'completed'
  },
  // Bank verification fields
  bankAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    default: null
  },
  bankTransactionId: {
    type: String,
    default: null,
    trim: true
  },
  bankVerificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'not_required'],
    default: 'not_required'
  },
  bankVerificationDate: {
    type: Date,
    default: null
  },
  bankVerificationDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Auto-verification flag
  autoVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
