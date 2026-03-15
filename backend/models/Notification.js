const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'manager', 'landlord', 'tenant'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'property_verification_required',
      'property_verified',
      'property_rejected',
      'previsit_requested',
      'previsit_confirmed',
      'previsit_cancelled',
      'payment_received',
      'invoice_generated',
      'maintenance_request',
      'complaint_submitted',
      'claim_submitted'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedResourceType: {
    type: String,
    enum: ['property', 'previsit', 'payment', 'invoice', 'maintenance', 'complaint', 'claim'],
    default: null
  },
  relatedResourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
