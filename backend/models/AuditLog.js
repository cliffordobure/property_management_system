const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['auth', 'user', 'organization', 'property', 'tenant', 'invoice', 'payment', 'expense', 'maintenance', 'complaint', 'claim', 'system', 'admin'],
    required: true,
    default: 'system'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userEmail: {
    type: String,
    default: null
  },
  userRole: {
    type: String,
    enum: ['admin', 'manager', 'landlord', 'tenant'],
    default: null
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  resourceType: {
    type: String,
    default: null // e.g., 'Property', 'Tenant', 'Invoice'
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  details: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
