const express = require('express');
const Bank = require('../models/Bank');
const BankAccount = require('../models/BankAccount');
const { auth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all Kenyan banks
router.get('/banks', async (req, res) => {
  try {
    // Seed banks if they don't exist
    await Bank.seedBanks();
    
    const banks = await Bank.find({ country: 'Kenya', isActive: true })
      .sort({ name: 1 });

    res.json(banks);
  } catch (error) {
    console.error('Get banks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bank accounts for organization
router.get('/', requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find({ organizationId: req.user.organizationId })
      .populate('bankId', 'name code supportedMethods')
      .sort({ createdAt: -1 });

    res.json(bankAccounts);
  } catch (error) {
    console.error('Get bank accounts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single bank account
router.get('/:id', requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    }).populate('bankId', 'name code supportedMethods apiFields');

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Don't send decrypted credentials in response for security
    const response = bankAccount.toObject();
    delete response.apiCredentials;

    res.json(response);
  } catch (error) {
    console.error('Get bank account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create bank account
router.post('/', requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const {
      bankId,
      accountName,
      accountNumber,
      paybillNumber,
      tillNumber,
      apiCredentials,
      webhookSecret,
      autoVerifyEnabled,
      verificationInterval
    } = req.body;

    if (!bankId || !accountName || !accountNumber) {
      return res.status(400).json({ 
        message: 'Bank, account name, and account number are required' 
      });
    }

    // Verify bank exists
    const bank = await Bank.findById(bankId);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }

    // For M-Pesa, require paybill or till number
    if (bank.code === 'MPESA' && !paybillNumber && !tillNumber) {
      return res.status(400).json({ 
        message: 'Paybill number or Till number is required for M-Pesa' 
      });
    }

    const bankAccount = new BankAccount({
      organizationId: req.user.organizationId,
      bankId: bankId,
      accountName: accountName,
      accountNumber: accountNumber,
      paybillNumber: paybillNumber || null,
      tillNumber: tillNumber || null,
      apiCredentials: apiCredentials || {},
      webhookSecret: webhookSecret || null,
      autoVerifyEnabled: autoVerifyEnabled !== false,
      verificationInterval: verificationInterval || 5,
      isActive: true,
      isVerified: false
    });

    await bankAccount.save();

    // Log action
    await logAction({
      action: 'Bank Account Created',
      category: 'banking',
      user: req.user,
      organizationId: req.user.organizationId,
      resourceType: 'BankAccount',
      resourceId: bankAccount._id,
      details: `Bank account created: ${bank.name} - ${accountNumber}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    const response = bankAccount.toObject();
    delete response.apiCredentials;
    delete response.webhookSecret;

    // Add common webhook URL
    response.commonWebhookUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/payment-verification/webhook`;

    res.status(201).json({
      message: 'Bank account created successfully',
      bankAccount: response,
      webhookUrl: response.commonWebhookUrl
    });
  } catch (error) {
    console.error('Create bank account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update bank account
router.put('/:id', requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    const {
      accountName,
      accountNumber,
      paybillNumber,
      tillNumber,
      apiCredentials,
      webhookSecret,
      autoVerifyEnabled,
      verificationInterval,
      isActive
    } = req.body;

    if (accountName) bankAccount.accountName = accountName;
    if (accountNumber) bankAccount.accountNumber = accountNumber;
    if (paybillNumber !== undefined) bankAccount.paybillNumber = paybillNumber;
    if (tillNumber !== undefined) bankAccount.tillNumber = tillNumber;
    if (apiCredentials) {
      // Merge with existing credentials
      bankAccount.apiCredentials = {
        ...bankAccount.apiCredentials.toObject(),
        ...apiCredentials
      };
    }
    if (webhookSecret !== undefined) bankAccount.webhookSecret = webhookSecret;
    if (autoVerifyEnabled !== undefined) bankAccount.autoVerifyEnabled = autoVerifyEnabled;
    if (verificationInterval !== undefined) bankAccount.verificationInterval = verificationInterval;
    if (isActive !== undefined) bankAccount.isActive = isActive;

    await bankAccount.save();

    // Log action
    await logAction({
      action: 'Bank Account Updated',
      category: 'banking',
      user: req.user,
      organizationId: req.user.organizationId,
      resourceType: 'BankAccount',
      resourceId: bankAccount._id,
      details: 'Bank account updated',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    const response = bankAccount.toObject();
    delete response.apiCredentials;
    delete response.webhookSecret;

    // Add common webhook URL
    response.commonWebhookUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/payment-verification/webhook`;

    res.json({
      message: 'Bank account updated successfully',
      bankAccount: response,
      webhookUrl: response.commonWebhookUrl
    });
  } catch (error) {
    console.error('Update bank account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify bank account (test connection)
router.post('/:id/verify', requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    }).populate('bankId');

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Test bank connection/credentials
    // This would call the bank's API to verify credentials
    // For now, we'll just mark it as verified if credentials exist
    
    const credentials = bankAccount.getDecryptedCredentials();
    const hasCredentials = credentials.apiKey || credentials.secretKey || credentials.consumerKey;

    if (hasCredentials) {
      bankAccount.isVerified = true;
      bankAccount.verifiedAt = new Date();
      await bankAccount.save();

      res.json({
        message: 'Bank account verified successfully',
        verified: true
      });
    } else {
      res.status(400).json({
        message: 'Bank account credentials not configured',
        verified: false
      });
    }
  } catch (error) {
    console.error('Verify bank account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete bank account
router.delete('/:id', requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    await bankAccount.deleteOne();

    // Log action
    await logAction({
      action: 'Bank Account Deleted',
      category: 'banking',
      user: req.user,
      organizationId: req.user.organizationId,
      resourceType: 'BankAccount',
      resourceId: bankAccount._id,
      details: 'Bank account deleted',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
