const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    default: null
  },
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['maintenance', 'repairs', 'utilities', 'supplies', 'insurance', 'taxes', 'legal', 'marketing', 'cleaning', 'security', 'management', 'other'],
    required: true,
    default: 'other'
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
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'credit_card', 'other'],
    default: 'cash'
  },
  vendor: {
    type: String,
    default: null,
    trim: true
  },
  referenceNumber: {
    type: String,
    default: null,
    trim: true
  },
  receiptNumber: {
    type: String,
    default: null,
    trim: true
  },
  notes: {
    type: String,
    default: null
  },
  receiptFile: {
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  // Link to maintenance request if expense is from maintenance
  maintenanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
