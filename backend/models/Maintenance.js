const mongoose = require('mongoose');

const maintenanceUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
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

const maintenanceSchema = new mongoose.Schema({
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
    default: null
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  requestedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'pest_control', 'cleaning', 'painting', 'roofing', 'flooring', 'carpentry', 'security', 'other'],
    required: true,
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true,
    default: 'medium'
  },
  title: {
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
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTo: {
    type: String,
    default: null, // Technician/contractor name or ID
    trim: true
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  estimatedCost: {
    type: Number,
    default: null,
    min: 0
  },
  actualCost: {
    type: Number,
    default: null,
    min: 0
  },
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  contractorInfo: {
    name: String,
    phone: String,
    email: String
  },
  updates: [maintenanceUpdateSchema],
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

// Generate request number before saving
maintenanceSchema.pre('validate', async function(next) {
  if (!this.requestNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.requestNumber = `MAINT-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
