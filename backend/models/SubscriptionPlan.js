const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['free', 'basic', 'premium', 'enterprise']
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  features: {
    maxProperties: {
      type: Number,
      default: null // null means unlimited
    },
    maxUnits: {
      type: Number,
      default: null
    },
    maxTenants: {
      type: Number,
      default: null
    },
    maxUsers: {
      type: Number,
      default: null
    },
    smsIncluded: {
      type: Number,
      default: 0 // Number of SMS messages included per month
    },
    supportLevel: {
      type: String,
      enum: ['basic', 'priority', 'dedicated'],
      default: 'basic'
    },
    advancedReports: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
