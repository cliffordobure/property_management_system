const BankAccount = require('../models/BankAccount');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Receipt = require('../models/Receipt');
const Tenant = require('../models/Tenant');
const axios = require('axios');

/**
 * Verify payment from bank/M-Pesa using reference code
 */
const verifyPaymentByReference = async (organizationId, referenceNumber, amount = null) => {
  try {
    // Find bank accounts for this organization
    const bankAccounts = await BankAccount.find({
      organizationId: organizationId,
      isActive: true,
      isVerified: true
    }).populate('bankId');

    if (bankAccounts.length === 0) {
      return {
        verified: false,
        message: 'No active bank accounts found for this organization'
      };
    }

    // Try to verify with each bank account
    for (const bankAccount of bankAccounts) {
      const bank = bankAccount.bankId;
      const credentials = bankAccount.getDecryptedCredentials();

      let verificationResult = null;

      // M-Pesa verification
      if (bank.code === 'MPESA') {
        verificationResult = await verifyMpesaPayment(
          credentials,
          bankAccount.paybillNumber || bankAccount.tillNumber,
          referenceNumber,
          amount
        );
      }
      // Equity Bank verification
      else if (bank.code === 'EQUITY') {
        verificationResult = await verifyEquityPayment(
          credentials,
          bankAccount.accountNumber,
          referenceNumber,
          amount
        );
      }
      // KCB Bank verification
      else if (bank.code === 'KCB') {
        verificationResult = await verifyKCBPayment(
          credentials,
          bankAccount.accountNumber,
          referenceNumber,
          amount
        );
      }
      // Generic bank transfer verification (for other banks)
      else {
        verificationResult = await verifyGenericBankPayment(
          credentials,
          bankAccount.accountNumber,
          referenceNumber,
          amount,
          bank
        );
      }

      if (verificationResult && verificationResult.verified) {
        return {
          verified: true,
          bankAccountId: bankAccount._id,
          transactionId: verificationResult.transactionId,
          amount: verificationResult.amount,
          transactionDate: verificationResult.transactionDate,
          details: verificationResult.details
        };
      }
    }

    return {
      verified: false,
      message: 'Payment not found in any connected bank account'
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      verified: false,
      message: error.message || 'Payment verification failed'
    };
  }
};

/**
 * Verify M-Pesa payment using Africa's Talking or Safaricom API
 */
const verifyMpesaPayment = async (credentials, paybillOrTill, referenceNumber, expectedAmount) => {
  try {
    // Using Africa's Talking API (if configured)
    if (credentials.apiKey && credentials.username) {
      const AfricasTalking = require('africastalking')({
        apiKey: credentials.apiKey,
        username: credentials.username
      });

      // Note: Africa's Talking doesn't have a direct payment verification API
      // This would need to be implemented via webhooks or Safaricom's API
      // For now, we'll use a placeholder that checks if reference matches format
      
      // In production, you would:
      // 1. Set up webhooks from Safaricom/Africa's Talking
      // 2. Use Safaricom's M-Pesa API to query transactions
      // 3. Match reference numbers

      return {
        verified: false,
        message: 'M-Pesa verification requires webhook setup or Safaricom API integration'
      };
    }

    // Alternative: Use Safaricom M-Pesa API directly
    if (credentials.consumerKey && credentials.consumerSecret) {
      // This would require implementing Safaricom's OAuth and query API
      // Placeholder for now
      return {
        verified: false,
        message: 'Safaricom API integration required'
      };
    }

    return {
      verified: false,
      message: 'M-Pesa credentials not properly configured'
    };
  } catch (error) {
    console.error('M-Pesa verification error:', error);
    return {
      verified: false,
      message: error.message
    };
  }
};

/**
 * Verify Equity Bank payment
 */
const verifyEquityPayment = async (credentials, accountNumber, referenceNumber, expectedAmount) => {
  try {
    // Equity Bank API integration
    // This would require Equity Bank's API credentials and endpoints
    // Placeholder implementation
    
    if (!credentials.apiKey || !credentials.secretKey) {
      return {
        verified: false,
        message: 'Equity Bank credentials not configured'
      };
    }

    // In production, make API call to Equity Bank
    // const response = await axios.post('https://equity-api-endpoint.com/verify', {
    //   accountNumber,
    //   referenceNumber,
    //   apiKey: credentials.apiKey,
    //   secretKey: credentials.secretKey
    // });

    return {
      verified: false,
      message: 'Equity Bank API integration required'
    };
  } catch (error) {
    console.error('Equity Bank verification error:', error);
    return {
      verified: false,
      message: error.message
    };
  }
};

/**
 * Verify KCB Bank payment
 */
const verifyKCBPayment = async (credentials, accountNumber, referenceNumber, expectedAmount) => {
  try {
    // KCB Bank API integration
    if (!credentials.apiKey || !credentials.secretKey) {
      return {
        verified: false,
        message: 'KCB Bank credentials not configured'
      };
    }

    // Placeholder for KCB API integration
    return {
      verified: false,
      message: 'KCB Bank API integration required'
    };
  } catch (error) {
    console.error('KCB Bank verification error:', error);
    return {
      verified: false,
      message: error.message
    };
  }
};

/**
 * Generic bank payment verification
 */
const verifyGenericBankPayment = async (credentials, accountNumber, referenceNumber, expectedAmount, bank) => {
  try {
    // Generic implementation for other banks
    // Would need bank-specific API endpoints
    
    return {
      verified: false,
      message: `${bank.name} API integration required`
    };
  } catch (error) {
    console.error('Generic bank verification error:', error);
    return {
      verified: false,
      message: error.message
    };
  }
};

/**
 * Auto-match payment by reference code and create payment record
 */
const autoMatchPayment = async (organizationId, referenceNumber, amount, bankAccountId, transactionId) => {
  try {
    // Find pending payments with matching reference
    const pendingPayments = await Payment.find({
      organizationId: organizationId,
      referenceNumber: referenceNumber,
      status: 'pending',
      bankVerificationStatus: 'pending'
    }).populate('invoiceId tenantId');

    if (pendingPayments.length === 0) {
      // Check if there's an invoice waiting for this reference
      const invoices = await Invoice.find({
        organizationId: organizationId,
        status: 'open'
      }).populate('tenantId');

      for (const invoice of invoices) {
        // Check if tenant has submitted a payment with this reference
        const tenantPayment = await Payment.findOne({
          organizationId: organizationId,
          invoiceId: invoice._id,
          referenceNumber: referenceNumber,
          status: 'pending'
        });

        if (tenantPayment) {
          // Update the existing pending payment
          tenantPayment.status = 'completed';
          tenantPayment.bankVerificationStatus = 'verified';
          tenantPayment.bankAccountId = bankAccountId;
          tenantPayment.bankTransactionId = transactionId;
          tenantPayment.bankVerificationDate = new Date();
          tenantPayment.autoVerified = true;
          tenantPayment.amount = amount || tenantPayment.amount;
          await tenantPayment.save();

          // Generate receipt
          await generateReceipt(tenantPayment);

          // Update invoice status
          await updateInvoiceStatus(invoice._id);

          return {
            matched: true,
            payment: tenantPayment,
            message: 'Payment automatically verified and matched'
          };
        }
      }

      return {
        matched: false,
        message: 'No pending payment found with this reference number'
      };
    }

    // Match the first pending payment
    const payment = pendingPayments[0];
    payment.status = 'completed';
    payment.bankVerificationStatus = 'verified';
    payment.bankAccountId = bankAccountId;
    payment.bankTransactionId = transactionId;
    payment.bankVerificationDate = new Date();
    payment.autoVerified = true;
    payment.amount = amount || payment.amount;
    await payment.save();

    // Generate receipt
    await generateReceipt(payment);

    // Update invoice status
    await updateInvoiceStatus(payment.invoiceId);

    return {
      matched: true,
      payment: payment,
      message: 'Payment automatically verified and matched'
    };
  } catch (error) {
    console.error('Auto-match payment error:', error);
    return {
      matched: false,
      message: error.message
    };
  }
};

/**
 * Generate receipt for a payment
 */
const generateReceipt = async (payment) => {
  try {
    // Check if receipt already exists
    const existingReceipt = await Receipt.findOne({ paymentId: payment._id });
    if (existingReceipt) {
      return existingReceipt;
    }

    await payment.populate('invoiceId tenantId propertyId');
    const invoice = payment.invoiceId;
    const tenant = payment.tenantId;
    const property = payment.propertyId;

    const receipt = new Receipt({
      organizationId: payment.organizationId,
      paymentId: payment._id,
      invoiceId: invoice._id,
      tenantId: tenant._id,
      amount: payment.amount,
      currency: 'KES',
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      tenantPhone: tenant.phoneNumber,
      propertyName: property?.propertyName || null,
      unitId: property?.unitId || null,
      invoiceNumber: invoice.invoiceNumber,
      sentToTenant: false
    });

    await receipt.save();

    // Update payment with receipt number
    payment.receiptNumber = receipt.receiptNumber;
    await payment.save();

    return receipt;
  } catch (error) {
    console.error('Generate receipt error:', error);
    throw error;
  }
};

/**
 * Update invoice status based on payments
 */
const updateInvoiceStatus = async (invoiceId) => {
  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return;

    const totalPayments = await Payment.aggregate([
      {
        $match: {
          invoiceId: invoice._id,
          status: { $in: ['completed', 'verified'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const paidAmount = totalPayments.length > 0 ? totalPayments[0].total : 0;

    if (paidAmount >= invoice.total) {
      invoice.status = 'paid';
    } else if (paidAmount > 0) {
      invoice.status = 'open';
    }

    await invoice.save();
  } catch (error) {
    console.error('Update invoice status error:', error);
  }
};

module.exports = {
  verifyPaymentByReference,
  autoMatchPayment,
  generateReceipt,
  updateInvoiceStatus
};
