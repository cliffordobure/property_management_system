const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  recipientType: {
    type: String,
    enum: ['single', 'bulk', 'all_tenants'],
    required: true
  },
  recipients: [{
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    },
    phoneNumber: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: null
    }
  }],
  message: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['manual', 'automatic', 'reminder'],
    default: 'manual'
  },
  reminderType: {
    type: String,
    enum: ['rent_due', 'invoice_overdue', 'lease_expiry', 'payment_confirmation', 'custom'],
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'partial'],
    default: 'pending'
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  results: [{
    phoneNumber: String,
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    },
    status: {
      type: String,
      enum: ['sent', 'failed']
    },
    messageId: String,
    error: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  sentAt: {
    type: Date,
    default: null
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SMS', smsSchema);
