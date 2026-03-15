const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  // Notification Preferences
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: true
  },
  invoiceNotifications: {
    type: Boolean,
    default: true
  },
  paymentNotifications: {
    type: Boolean,
    default: true
  },
  maintenanceNotifications: {
    type: Boolean,
    default: true
  },
  // Display Preferences
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  language: {
    type: String,
    default: 'en'
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY' // MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  },
  timeFormat: {
    type: String,
    enum: ['12h', '24h'],
    default: '12h'
  },
  currency: {
    type: String,
    default: 'KES'
  },
  // Dashboard Preferences
  dashboardWidgets: [{
    type: String,
    enum: ['revenue', 'expenses', 'properties', 'tenants', 'invoices', 'maintenance']
  }],
  defaultView: {
    type: String,
    enum: ['dashboard', 'properties', 'tenants', 'invoices'],
    default: 'dashboard'
  },
  // Other Preferences
  itemsPerPage: {
    type: Number,
    default: 20,
    min: 10,
    max: 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
