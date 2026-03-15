const mongoose = require('mongoose');
const crypto = require('crypto');

const bankAccountSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  bankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    required: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  // M-Pesa specific
  paybillNumber: {
    type: String,
    default: null,
    trim: true
  },
  tillNumber: {
    type: String,
    default: null,
    trim: true
  },
  // Bank API credentials (encrypted)
  apiCredentials: {
    apiKey: {
      type: String,
      default: null
    },
    secretKey: {
      type: String,
      default: null
    },
    clientId: {
      type: String,
      default: null
    },
    clientSecret: {
      type: String,
      default: null
    },
    merchantId: {
      type: String,
      default: null
    },
    merchantKey: {
      type: String,
      default: null
    },
    consumerKey: {
      type: String,
      default: null
    },
    consumerSecret: {
      type: String,
      default: null
    },
    passKey: {
      type: String,
      default: null
    },
    // Additional custom fields
    customFields: {
      type: Map,
      of: String,
      default: {}
    }
  },
  // Webhook secret for verification (system uses common webhook URL)
  webhookSecret: {
    type: String,
    default: null
  },
  // Verification settings
  autoVerifyEnabled: {
    type: Boolean,
    default: true
  },
  verificationInterval: {
    type: Number,
    default: 5, // minutes
    min: 1,
    max: 60
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Encrypt sensitive fields before saving
bankAccountSchema.pre('save', async function(next) {
  if (this.isModified('apiCredentials')) {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32chars!!';
    
    // Ensure key is 32 bytes for AES-256
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const algorithm = 'aes-256-cbc';
    
    // Encrypt each credential field
    const encrypt = (text) => {
      if (!text) return null;
      try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Prepend IV to encrypted data (IV is not secret, needed for decryption)
        return iv.toString('hex') + ':' + encrypted;
      } catch (error) {
        console.error('Encryption error:', error);
        return null;
      }
    };

    if (this.apiCredentials.apiKey && !this.apiCredentials.apiKey.includes(':')) {
      this.apiCredentials.apiKey = encrypt(this.apiCredentials.apiKey);
    }
    if (this.apiCredentials.secretKey && !this.apiCredentials.secretKey.includes(':')) {
      this.apiCredentials.secretKey = encrypt(this.apiCredentials.secretKey);
    }
    if (this.apiCredentials.clientSecret && !this.apiCredentials.clientSecret.includes(':')) {
      this.apiCredentials.clientSecret = encrypt(this.apiCredentials.clientSecret);
    }
    if (this.apiCredentials.merchantKey && !this.apiCredentials.merchantKey.includes(':')) {
      this.apiCredentials.merchantKey = encrypt(this.apiCredentials.merchantKey);
    }
    if (this.apiCredentials.consumerSecret && !this.apiCredentials.consumerSecret.includes(':')) {
      this.apiCredentials.consumerSecret = encrypt(this.apiCredentials.consumerSecret);
    }
    if (this.apiCredentials.passKey && !this.apiCredentials.passKey.includes(':')) {
      this.apiCredentials.passKey = encrypt(this.apiCredentials.passKey);
    }
  }
  next();
});

// Decrypt method (for use in services)
bankAccountSchema.methods.getDecryptedCredentials = function() {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32chars!!';
  
  // Ensure key is 32 bytes for AES-256
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const algorithm = 'aes-256-cbc';
  
  const decrypt = (encryptedText) => {
    if (!encryptedText) return null;
    try {
      // Check if text is already decrypted (doesn't contain IV separator)
      if (!encryptedText.includes(':')) {
        return encryptedText; // Already decrypted or plain text
      }
      
      // Split IV and encrypted data
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        return encryptedText; // Invalid format, return as-is
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      // If decryption fails, might be plain text, return as-is
      return encryptedText;
    }
  };

  return {
    apiKey: decrypt(this.apiCredentials.apiKey),
    secretKey: decrypt(this.apiCredentials.secretKey),
    clientId: this.apiCredentials.clientId,
    clientSecret: decrypt(this.apiCredentials.clientSecret),
    merchantId: this.apiCredentials.merchantId,
    merchantKey: decrypt(this.apiCredentials.merchantKey),
    consumerKey: this.apiCredentials.consumerKey,
    consumerSecret: decrypt(this.apiCredentials.consumerSecret),
    passKey: decrypt(this.apiCredentials.passKey),
    customFields: this.apiCredentials.customFields
  };
};

module.exports = mongoose.model('BankAccount', bankAccountSchema);
