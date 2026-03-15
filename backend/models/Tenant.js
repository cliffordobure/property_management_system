const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['security', 'rent', 'other'],
    default: 'security'
  },
  amount: {
    type: Number,
    default: 0
  },
  paid: {
    type: Number,
    default: 0
  },
  amountReturned: {
    type: Number,
    default: 0
  }
});

const tenantSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
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
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Required fields
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  // Optional fields
  deposit: {
    type: depositSchema,
    default: null
  },
  accountNumber: {
    type: String,
    default: null
  },
  nationalId: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true
  },
  kraTaxPin: {
    type: String,
    default: null
  },
  rentPaymentPenalty: {
    type: Number,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  moveInDate: {
    type: Date,
    default: null
  },
  otherPhoneNumbers: [{
    type: String
  }],
  leaseStartDate: {
    type: Date,
    default: null
  },
  leaseExpiryDate: {
    type: Date,
    default: null
  },
  uploadedFiles: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // SMS Reminder Permissions
  smsRemindersDisabled: {
    type: Boolean,
    default: false
  },
  smsDisabledUntil: {
    type: Date,
    default: null
  },
  smsDisableReason: {
    type: String,
    default: null
  },
  smsDisableRequestedBy: {
    type: String, // 'tenant' or 'landlord'
    default: null
  },
  smsDisableApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  smsDisableApprovedAt: {
    type: Date,
    default: null
  },
  lastSMSReminderSent: {
    type: Date,
    default: null
  },
  lastSMSReminderType: {
    type: String,
    enum: ['pre_due', 'overdue'],
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tenant', tenantSchema);
