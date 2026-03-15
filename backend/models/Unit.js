const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  unitId: {
    type: String,
    required: true,
    trim: true
  },
  rentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Optional fields
  taxRate: {
    type: Number,
    default: null
  },
  otherRecurringBills: [{
    name: String,
    amount: Number
  }],
  notes: {
    type: String,
    default: null
  },
  isOccupied: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Unit', unitSchema);
