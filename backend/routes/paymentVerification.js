const express = require('express');
const { verifyPaymentByReference, autoMatchPayment } = require('../utils/paymentVerification');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const BankAccount = require('../models/BankAccount');
const { auth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// Most routes require authentication, but webhook is public (called by banks)

// Verify payment by reference number (requires auth)
router.post('/verify', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { referenceNumber, amount } = req.body;

    if (!referenceNumber) {
      return res.status(400).json({ message: 'Reference number is required' });
    }

    // Verify payment with banks
    const verificationResult = await verifyPaymentByReference(
      req.user.organizationId,
      referenceNumber,
      amount
    );

    if (verificationResult.verified) {
      // Try to auto-match with pending payments
      const matchResult = await autoMatchPayment(
        req.user.organizationId,
        referenceNumber,
        verificationResult.amount,
        verificationResult.bankAccountId,
        verificationResult.transactionId
      );

      if (matchResult.matched) {
        // Log action
        await logAction({
          action: 'Payment Auto-Verified',
          category: 'payment',
          user: req.user,
          organizationId: req.user.organizationId,
          resourceType: 'Payment',
          resourceId: matchResult.payment._id,
          details: `Payment verified and matched automatically using reference: ${referenceNumber}`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });

        return res.json({
          verified: true,
          matched: true,
          payment: matchResult.payment,
          message: matchResult.message
        });
      } else {
        return res.json({
          verified: true,
          matched: false,
          transactionDetails: verificationResult,
          message: 'Payment verified but no matching invoice found. Please create payment manually.'
        });
      }
    } else {
      return res.json({
        verified: false,
        message: verificationResult.message || 'Payment not found'
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manual payment verification (for cash/manual payments) (requires auth)
router.post('/verify-manual', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { paymentId, verified } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      organizationId: req.user.organizationId
    }).populate('invoiceId tenantId');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (verified) {
      payment.status = 'completed';
      payment.bankVerificationStatus = 'not_required';
      payment.verifiedBy = req.user._id;
      await payment.save();

      // Generate receipt
      const { generateReceipt, updateInvoiceStatus } = require('../utils/paymentVerification');
      await generateReceipt(payment);
      await updateInvoiceStatus(payment.invoiceId);

      // Log action
      await logAction({
        action: 'Payment Manually Verified',
        category: 'payment',
        user: req.user,
        organizationId: req.user.organizationId,
        resourceType: 'Payment',
        resourceId: payment._id,
        details: 'Payment manually verified and receipt generated',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      res.json({
        message: 'Payment verified successfully',
        payment: payment
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      res.json({
        message: 'Payment marked as failed',
        payment: payment
      });
    }
  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending payments awaiting verification (requires auth)
router.get('/pending', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const payments = await Payment.find({
      organizationId: req.user.organizationId,
      status: 'pending',
      referenceNumber: { $ne: null }
    })
      .populate('invoiceId', 'invoiceNumber invoiceDate total')
      .populate('tenantId', 'firstName lastName phoneNumber')
      .populate('propertyId', 'propertyName')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Common webhook endpoint for all bank payment notifications
// Banks will send webhook to this single endpoint with account/paybill identifier
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    const headers = req.headers;

    // Extract account identifier from webhook data (varies by bank)
    // Common fields: accountNumber, paybillNumber, tillNumber, merchantId, accountId
    const accountNumber = webhookData.accountNumber || webhookData.account || webhookData.accountId;
    const paybillNumber = webhookData.paybillNumber || webhookData.paybill || webhookData.businessNumber;
    const tillNumber = webhookData.tillNumber || webhookData.till || webhookData.shortCode;
    const merchantId = webhookData.merchantId || webhookData.merchant_id;

    // Find bank account by identifier
    let bankAccount = null;
    
    if (accountNumber) {
      bankAccount = await BankAccount.findOne({
        accountNumber: accountNumber,
        isActive: true
      }).populate('organizationId');
    }
    
    if (!bankAccount && paybillNumber) {
      bankAccount = await BankAccount.findOne({
        paybillNumber: paybillNumber,
        isActive: true
      }).populate('organizationId');
    }
    
    if (!bankAccount && tillNumber) {
      bankAccount = await BankAccount.findOne({
        tillNumber: tillNumber,
        isActive: true
      }).populate('organizationId');
    }

    if (!bankAccount && merchantId) {
      // Try to find by merchant ID in custom fields
      bankAccount = await BankAccount.findOne({
        'apiCredentials.merchantId': merchantId,
        isActive: true
      }).populate('organizationId');
    }

    if (!bankAccount) {
      console.log('Webhook received but no matching bank account found:', {
        accountNumber,
        paybillNumber,
        tillNumber,
        merchantId
      });
      return res.status(404).json({ 
        message: 'Bank account not found',
        received: { accountNumber, paybillNumber, tillNumber, merchantId }
      });
    }

    // Verify webhook secret if configured
    if (bankAccount.webhookSecret) {
      const signature = headers['x-webhook-signature'] || headers['x-signature'] || headers['authorization'];
      // Verify signature (implementation depends on bank)
      // For now, we'll log it but not enforce strict verification
      if (signature && signature !== bankAccount.webhookSecret) {
        console.warn('Webhook signature mismatch for account:', bankAccount.accountNumber);
      }
    }

    // Extract payment details from webhook (format varies by bank)
    const referenceNumber = webhookData.referenceNumber || 
                           webhookData.transactionReference || 
                           webhookData.reference || 
                           webhookData.transaction_id ||
                           webhookData.receiptNumber ||
                           webhookData.mpesaReceiptNumber;
    const amount = parseFloat(webhookData.amount || webhookData.transactionAmount || webhookData.amount_paid);
    const transactionId = webhookData.transactionId || 
                         webhookData.id || 
                         webhookData.transaction_id ||
                         webhookData.requestId;

    if (!referenceNumber || !amount || isNaN(amount)) {
      console.error('Invalid webhook data - missing reference or amount:', webhookData);
      return res.status(400).json({ 
        message: 'Invalid webhook data - reference number and amount are required',
        received: webhookData
      });
    }

    console.log('Processing webhook payment:', {
      organizationId: bankAccount.organizationId._id,
      referenceNumber,
      amount,
      transactionId,
      accountNumber: bankAccount.accountNumber
    });

    // Auto-match payment
    const matchResult = await autoMatchPayment(
      bankAccount.organizationId._id,
      referenceNumber,
      amount,
      bankAccount._id,
      transactionId
    );

    if (matchResult.matched) {
      res.json({
        success: true,
        message: 'Payment processed successfully',
        payment: matchResult.payment,
        receiptNumber: matchResult.payment.receiptNumber
      });
    } else {
      // Payment received but no matching invoice - log for manual processing
      console.log('Payment received but no matching invoice:', {
        organizationId: bankAccount.organizationId._id,
        referenceNumber,
        amount
      });
      res.json({
        success: true,
        message: 'Payment received but no matching invoice found. Please create payment manually.',
        received: {
          referenceNumber,
          amount,
          transactionId,
          organizationId: bankAccount.organizationId._id
        }
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
