const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const SMSConfig = require('../models/SMSConfig');
const SMS = require('../models/SMS');
const AfricasTalking = require('africastalking');

// Helper to get Africa's Talking client
const getAfricasTalkingClient = (config) => {
  const apiKey = config.africasTalkingApiKey || process.env.AFRICAS_TALKING_API_KEY;
  const username = config.africasTalkingUsername || process.env.AFRICAS_TALKING_USERNAME;

  if (!apiKey || !username) {
    throw new Error('Africa\'s Talking API credentials not configured');
  }

  return AfricasTalking({
    apiKey: apiKey,
    username: username
  }).SMS;
};

// Check if tenant has paid for current period
const hasPaidForPeriod = async (tenant, leaseStartDate) => {
  if (!leaseStartDate) return false;

  const now = new Date();
  const leaseDate = new Date(leaseStartDate);
  
  // Calculate current period (30 days from lease start)
  const daysSinceLeaseStart = Math.floor((now - leaseDate) / (1000 * 60 * 60 * 24));
  const currentPeriod = Math.floor(daysSinceLeaseStart / 30);
  
  const periodStart = new Date(leaseDate);
  periodStart.setDate(periodStart.getDate() + (currentPeriod * 30));
  
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + 30);

  // Check if there's a paid invoice for this period
  const invoices = await Invoice.find({
    tenantId: tenant._id,
    invoiceDate: { $gte: periodStart, $lte: periodEnd },
    status: 'paid'
  });

  if (invoices.length > 0) {
    // Check if total payments cover the invoice
    for (const invoice of invoices) {
      const payments = await Payment.aggregate([
        {
          $match: {
            invoiceId: invoice._id,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const totalPaid = payments.length > 0 ? payments[0].total : 0;
      if (totalPaid >= invoice.total) {
        return true;
      }
    }
  }

  return false;
};

// Send SMS reminder
const sendSMSReminder = async (tenant, config, message, reminderType) => {
  try {
    if (!tenant.phoneNumber) {
      console.log(`No phone number for tenant ${tenant._id}`);
      return false;
    }

    const smsClient = getAfricasTalkingClient(config);
    const senderId = config.africasTalkingSenderId || 'TURBINE';

    const options = {
      to: tenant.phoneNumber,
      message: message,
      from: senderId
    };

    const result = await smsClient.send(options);

    // Create SMS record
    const smsRecord = new SMS({
      organizationId: tenant.organizationId,
      recipientType: 'single',
      recipients: [{
        tenantId: tenant._id,
        phoneNumber: tenant.phoneNumber,
        name: `${tenant.firstName} ${tenant.lastName}`
      }],
      message: message,
      messageType: 'automatic',
      reminderType: reminderType,
      status: 'sent',
      successCount: 1,
      failureCount: 0,
      results: [{
        phoneNumber: tenant.phoneNumber,
        tenantId: tenant._id,
        status: 'sent',
        messageId: result.SMSMessageData?.Recipients?.[0]?.messageId || null
      }],
      sentAt: new Date()
    });

    await smsRecord.save();

    // Update tenant's last SMS reminder info
    tenant.lastSMSReminderSent = new Date();
    tenant.lastSMSReminderType = reminderType;
    await tenant.save();

    return true;
  } catch (error) {
    console.error(`Error sending SMS to tenant ${tenant._id}:`, error);
    
    // Create failed SMS record
    try {
      const smsRecord = new SMS({
        organizationId: tenant.organizationId,
        recipientType: 'single',
        recipients: [{
          tenantId: tenant._id,
          phoneNumber: tenant.phoneNumber,
          name: `${tenant.firstName} ${tenant.lastName}`
        }],
        message: message,
        messageType: 'automatic',
        reminderType: reminderType,
        status: 'failed',
        successCount: 0,
        failureCount: 1,
        results: [{
          phoneNumber: tenant.phoneNumber,
          tenantId: tenant._id,
          status: 'failed',
          error: error.message || 'SMS sending failed'
        }],
        error: error.message || 'SMS sending failed'
      });
      await smsRecord.save();
    } catch (saveError) {
      console.error('Error saving failed SMS record:', saveError);
    }

    return false;
  }
};

// Main function to process automatic rent reminders
const processAutomaticRentReminders = async () => {
  try {
    console.log('Processing automatic rent reminders...');
    
    // Get all organizations with automatic reminders enabled
    const configs = await SMSConfig.find({ automaticRentRemindersEnabled: true });
    
    for (const config of configs) {
      try {
        // Get all active tenants for this organization
        const tenants = await Tenant.find({
          organizationId: config.organizationId,
          isActive: true,
          leaseStartDate: { $exists: true, $ne: null }
        })
        .populate('propertyId', 'propertyName')
        .populate('unitId', 'unitId rentAmount');

        for (const tenant of tenants) {
          // Skip if SMS is disabled
          if (tenant.smsRemindersDisabled) {
            // Check if disable period has expired
            if (tenant.smsDisabledUntil && new Date(tenant.smsDisabledUntil) < new Date()) {
              // Re-enable SMS
              tenant.smsRemindersDisabled = false;
              tenant.smsDisabledUntil = null;
              await tenant.save();
            } else {
              continue; // Skip this tenant
            }
          }

          if (!tenant.leaseStartDate) continue;

          const leaseStartDate = new Date(tenant.leaseStartDate);
          const now = new Date();
          const daysSinceLeaseStart = Math.floor((now - leaseStartDate) / (1000 * 60 * 60 * 24));
          
          // Check if already paid for current period
          const hasPaid = await hasPaidForPeriod(tenant, leaseStartDate);
          if (hasPaid) {
            continue; // Skip if already paid
          }

          const reminderDaysBefore = config.rentReminderDaysBefore || 2;
          const reminderDaysAfter = config.rentReminderDaysAfter || 30;
          const overdueFrequency = config.overdueSMSFrequency || 2;

          // Calculate days until next 30-day period
          const currentPeriod = Math.floor(daysSinceLeaseStart / 30);
          const nextPeriodStart = new Date(leaseStartDate);
          nextPeriodStart.setDate(nextPeriodStart.getDate() + ((currentPeriod + 1) * 30));
          const daysUntilNextPeriod = Math.floor((nextPeriodStart - now) / (1000 * 60 * 60 * 24));

          // Check if we should send pre-due reminder (2 days before 30 days)
          if (daysUntilNextPeriod === reminderDaysBefore && daysSinceLeaseStart < (currentPeriod + 1) * 30) {
            // Send reminder 2 days before
            const rentAmount = tenant.unitId?.rentAmount || 0;
            const message = config.customRentDueMessage || 
              `Hello ${tenant.firstName}, this is a reminder that your rent payment of KES ${rentAmount.toLocaleString()} is due in ${reminderDaysBefore} days. Please make payment to avoid any penalties. Thank you.`;

            // Only send if we haven't sent this type today
            const lastSent = tenant.lastSMSReminderSent;
            const shouldSend = !lastSent || 
              (lastSent.getDate() !== now.getDate() || 
               lastSent.getMonth() !== now.getMonth() || 
               lastSent.getFullYear() !== now.getFullYear() ||
               tenant.lastSMSReminderType !== 'pre_due');

            if (shouldSend) {
              await sendSMSReminder(tenant, config, message, 'rent_due');
              console.log(`Sent pre-due reminder to tenant ${tenant._id}`);
            }
          }
          
          // Check if overdue (more than 30 days since last period)
          const daysOverdue = daysSinceLeaseStart - ((currentPeriod + 1) * 30);
          if (daysOverdue > 0) {
            // Send 2 SMS daily when overdue
            const rentAmount = tenant.unitId?.rentAmount || 0;
            const message = config.customInvoiceOverdueMessage || 
              `Hello ${tenant.firstName}, your rent payment of KES ${rentAmount.toLocaleString()} is overdue by ${daysOverdue} day(s). Please make payment immediately to avoid further penalties. Thank you.`;

            // Check if we should send (2 SMS per day)
            const lastSent = tenant.lastSMSReminderSent;
            let shouldSend = false;

            if (!lastSent) {
              shouldSend = true;
            } else {
              const hoursSinceLastSent = (now - lastSent) / (1000 * 60 * 60);
              // Send 2 SMS per day = every 12 hours
              if (hoursSinceLastSent >= (24 / overdueFrequency)) {
                shouldSend = true;
              }
            }

            if (shouldSend && config.overdueDailySMSEnabled) {
              await sendSMSReminder(tenant, config, message, 'invoice_overdue');
              console.log(`Sent overdue reminder to tenant ${tenant._id} (${daysOverdue} days overdue)`);
            }
          }
        }
      } catch (orgError) {
        console.error(`Error processing reminders for organization ${config.organizationId}:`, orgError);
      }
    }

    console.log('Automatic rent reminders processing completed');
  } catch (error) {
    console.error('Error processing automatic rent reminders:', error);
  }
};

module.exports = {
  processAutomaticRentReminders
};
