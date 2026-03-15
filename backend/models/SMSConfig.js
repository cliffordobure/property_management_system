const mongoose = require('mongoose');

const smsConfigSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true
  },
  africasTalkingApiKey: {
    type: String,
    default: null,
    trim: true
  },
  africasTalkingUsername: {
    type: String,
    default: null,
    trim: true
  },
  africasTalkingSenderId: {
    type: String,
    default: null,
    trim: true
  },
  autoRemindersEnabled: {
    type: Boolean,
    default: false
  },
  rentDueReminderEnabled: {
    type: Boolean,
    default: false
  },
  rentDueReminderDays: {
    type: Number,
    default: 3,
    min: 1,
    max: 30
  },
  invoiceOverdueReminderEnabled: {
    type: Boolean,
    default: false
  },
  invoiceOverdueReminderDays: {
    type: Number,
    default: 7,
    min: 1,
    max: 90
  },
  leaseExpiryReminderEnabled: {
    type: Boolean,
    default: false
  },
  leaseExpiryReminderDays: {
    type: Number,
    default: 30,
    min: 1,
    max: 365
  },
  paymentConfirmationEnabled: {
    type: Boolean,
    default: true
  },
  customRentDueMessage: {
    type: String,
    default: null
  },
  customInvoiceOverdueMessage: {
    type: String,
    default: null
  },
  customLeaseExpiryMessage: {
    type: String,
    default: null
  },
  customPaymentConfirmationMessage: {
    type: String,
    default: null
  },
  // Automatic rent payment reminders based on lease start date
  automaticRentRemindersEnabled: {
    type: Boolean,
    default: false
  },
  rentReminderDaysBefore: {
    type: Number,
    default: 2,
    min: 0,
    max: 7
  },
  rentReminderDaysAfter: {
    type: Number,
    default: 30,
    min: 1
  },
  overdueDailySMSEnabled: {
    type: Boolean,
    default: true
  },
  overdueSMSFrequency: {
    type: Number,
    default: 2, // Number of SMS per day when overdue
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SMSConfig', smsConfigSchema);
