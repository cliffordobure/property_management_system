const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  country: {
    type: String,
    default: 'Kenya'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Bank API configuration fields (varies by bank)
  apiFields: [{
    fieldName: {
      type: String,
      required: true
    },
    fieldLabel: {
      type: String,
      required: true
    },
    fieldType: {
      type: String,
      enum: ['text', 'password', 'number', 'url'],
      default: 'text'
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: null
    }
  }],
  // Supported payment methods
  supportedMethods: [{
    type: String,
    enum: ['bank_transfer', 'mpesa', 'paybill', 'till_number', 'bank_deposit', 'rtgs', 'swift']
  }],
  // API endpoint templates (if applicable)
  apiEndpoints: {
    verifyTransaction: String,
    getBalance: String,
    webhookUrl: String
  },
  // Documentation URL
  documentationUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Predefined Kenyan banks
const KENYAN_BANKS = [
  { name: 'M-Pesa', code: 'MPESA', supportedMethods: ['mpesa', 'paybill', 'till_number'] },
  { name: 'Equity Bank', code: 'EQUITY', supportedMethods: ['bank_transfer', 'paybill', 'bank_deposit'] },
  { name: 'KCB Bank', code: 'KCB', supportedMethods: ['bank_transfer', 'paybill', 'bank_deposit', 'rtgs'] },
  { name: 'Co-operative Bank', code: 'COOP', supportedMethods: ['bank_transfer', 'paybill', 'bank_deposit'] },
  { name: 'Standard Chartered Bank', code: 'SCB', supportedMethods: ['bank_transfer', 'bank_deposit', 'rtgs', 'swift'] },
  { name: 'Barclays Bank (Absa)', code: 'ABSA', supportedMethods: ['bank_transfer', 'bank_deposit', 'rtgs', 'swift'] },
  { name: 'Diamond Trust Bank', code: 'DTB', supportedMethods: ['bank_transfer', 'paybill', 'bank_deposit'] },
  { name: 'Stanbic Bank', code: 'STANBIC', supportedMethods: ['bank_transfer', 'bank_deposit', 'rtgs'] },
  { name: 'NCBA Bank', code: 'NCBA', supportedMethods: ['bank_transfer', 'paybill', 'bank_deposit', 'rtgs'] },
  { name: 'I&M Bank', code: 'IMB', supportedMethods: ['bank_transfer', 'bank_deposit', 'rtgs'] },
  { name: 'Family Bank', code: 'FAMILY', supportedMethods: ['bank_transfer', 'paybill', 'bank_deposit'] },
  { name: 'GT Bank', code: 'GTB', supportedMethods: ['bank_transfer', 'bank_deposit'] },
  { name: 'Bank of Africa', code: 'BOA', supportedMethods: ['bank_transfer', 'bank_deposit'] },
  { name: 'Sidian Bank', code: 'SIDIAN', supportedMethods: ['bank_transfer', 'bank_deposit'] },
  { name: 'Paramount Bank', code: 'PARAMOUNT', supportedMethods: ['bank_transfer', 'bank_deposit'] },
  { name: 'Credit Bank', code: 'CREDIT', supportedMethods: ['bank_transfer', 'bank_deposit'] },
  { name: 'Guardian Bank', code: 'GUARDIAN', supportedMethods: ['bank_transfer', 'bank_deposit'] },
  { name: 'Housing Finance Bank', code: 'HFB', supportedMethods: ['bank_transfer', 'bank_deposit'] },
  { name: 'Prime Bank', code: 'PRIME', supportedMethods: ['bank_transfer', 'bank_deposit'] },
  { name: 'Spire Bank', code: 'SPIRE', supportedMethods: ['bank_transfer', 'bank_deposit'] }
];

// Static method to seed banks
bankSchema.statics.seedBanks = async function() {
  for (const bank of KENYAN_BANKS) {
    await this.findOneAndUpdate(
      { code: bank.code },
      {
        name: bank.name,
        code: bank.code,
        country: 'Kenya',
        supportedMethods: bank.supportedMethods,
        isActive: true
      },
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Bank', bankSchema);
