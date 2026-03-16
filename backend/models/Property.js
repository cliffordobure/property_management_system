const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  propertyName: {
    type: String,
    required: true,
    trim: true
  },
  numberOfUnits: {
    type: Number,
    required: true,
    min: 1
  },
  country: {
    type: String,
    default: 'Kenya',
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: null,
    trim: true
  },
  // Optional fields
  waterRate: {
    type: Number,
    default: null
  },
  electricityRate: {
    type: Number,
    default: null
  },
  mpesaPaybill: {
    type: String,
    default: null
  },
  mpesaTill: {
    type: String,
    default: null
  },
  rentPaymentPenalty: {
    type: Number,
    default: null
  },
  taxRate: {
    type: Number,
    default: null
  },
  garbageBill: {
    type: Number,
    default: null
  },
  managementFee: {
    type: Number,
    default: null
  },
  streetName: {
    type: String,
    default: null
  },
  companyName: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  paymentInstructions: {
    type: String,
    default: null
  },
  otherRecurringBills: [{
    name: String,
    amount: Number
  }],
  // Advertise-only listing: pay to list (no full management)
  listingType: {
    type: String,
    enum: ['full_management', 'advertise_only'],
    default: null // null = inherit from organization
  },
  listingFeeStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  listingFeePaidAt: {
    type: Date,
    default: null
  },
  // Property verification (for full_management; for advertise_only, listingFeeStatus=paid means listed)
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verificationNotes: {
    type: String,
    default: null
  },
  // Auto-calculated pricing
  calculatedPricing: {
    planName: String,
    planPrice: Number,
    currency: String,
    billingPeriod: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);
