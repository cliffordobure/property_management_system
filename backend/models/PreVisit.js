const mongoose = require('mongoose');

const preVisitSchema = new mongoose.Schema({
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
  // Visitor information (can be from website, not necessarily a registered tenant)
  visitorName: {
    type: String,
    required: true,
    trim: true
  },
  visitorPhone: {
    type: String,
    required: true,
    trim: true
  },
  visitorEmail: {
    type: String,
    default: null,
    trim: true,
    lowercase: true
  },
  // If visitor is a registered tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Visit details
  requestedDate: {
    type: Date,
    required: true
  },
  requestedTime: {
    type: String, // e.g., "10:00 AM", "2:00 PM"
    required: true
  },
  preferredContactMethod: {
    type: String,
    enum: ['phone', 'email', 'sms'],
    default: 'phone'
  },
  message: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  confirmedDate: {
    type: Date,
    default: null
  },
  confirmedTime: {
    type: String,
    default: null
  },
  landlordNotes: {
    type: String,
    default: null
  },
  // Notification tracking
  landlordNotified: {
    type: Boolean,
    default: false
  },
  landlordNotifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for checking daily visit limits
preVisitSchema.index({ visitorPhone: 1, requestedDate: 1 });

module.exports = mongoose.model('PreVisit', preVisitSchema);
