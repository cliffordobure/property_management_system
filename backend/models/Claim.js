const mongoose = require('mongoose');

const claimUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'paid', 'cancelled'],
    required: true
  },
  notes: {
    type: String,
    default: null
  },
  updatedBy: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const claimSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
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
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    default: null
  },
  claimNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  claimType: {
    type: String,
    enum: ['deposit_refund', 'overpayment_refund', 'damage_compensation', 'maintenance_compensation', 'utility_refund', 'other'],
    required: true,
    default: 'other'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
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
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'paid', 'cancelled'],
    default: 'pending'
  },
  submittedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reviewedDate: {
    type: Date,
    default: null
  },
  approvedDate: {
    type: Date,
    default: null
  },
  paidDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  approvalNotes: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cheque', 'cash', 'other'],
    default: null
  },
  paymentReference: {
    type: String,
    default: null
  },
  updates: [claimUpdateSchema],
  uploadedFiles: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate claim number before saving
claimSchema.pre('validate', async function(next) {
  if (!this.claimNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.claimNumber = `CLAIM-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Claim', claimSchema);
