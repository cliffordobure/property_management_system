const mongoose = require('mongoose');

const complaintUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'rejected'],
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

const complaintSchema = new mongoose.Schema({
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
  complaintNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['noise', 'maintenance', 'security', 'billing', 'neighbor', 'property_condition', 'management', 'other'],
    required: true,
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true,
    default: 'medium'
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
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  submittedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  acknowledgedDate: {
    type: Date,
    default: null
  },
  resolvedDate: {
    type: Date,
    default: null
  },
  resolution: {
    type: String,
    default: null
  },
  resolutionNotes: {
    type: String,
    default: null
  },
  updates: [complaintUpdateSchema],
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

// Generate complaint number before saving
complaintSchema.pre('validate', async function(next) {
  if (!this.complaintNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.complaintNumber = `COMP-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
