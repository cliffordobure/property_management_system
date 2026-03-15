const mongoose = require('mongoose');

const utilitySchema = new mongoose.Schema({
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
  utilityType: {
    type: String,
    enum: ['water', 'electricity', 'gas', 'internet', 'sewer', 'trash', 'other'],
    required: true
  },
  billingPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  meterReading: {
    previous: {
      type: Number,
      default: null
    },
    current: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      default: null // e.g., 'kWh', 'm³', 'gallons'
    }
  },
  rate: {
    type: Number,
    default: null // Rate per unit
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    default: null
  },
  paidDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  accountNumber: {
    type: String,
    default: null,
    trim: true
  },
  referenceNumber: {
    type: String,
    default: null,
    trim: true
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Utility', utilitySchema);
