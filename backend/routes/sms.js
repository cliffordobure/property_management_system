const express = require('express');
const AfricasTalking = require('africastalking');
const SMS = require('../models/SMS');
const SMSConfig = require('../models/SMSConfig');
const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get SMS configuration
router.get('/config', auth, async (req, res) => {
  try {
    let config = await SMSConfig.findOne({ organizationId: req.user.organizationId });
    
    if (!config) {
      // Create default config
      config = new SMSConfig({
        organizationId: req.user.organizationId
      });
      await config.save();
    }

    res.json(config);
  } catch (error) {
    console.error('Get SMS config error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update SMS configuration
router.put('/config', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    let config = await SMSConfig.findOne({ organizationId: req.user.organizationId });

    if (!config) {
      config = new SMSConfig({
        organizationId: req.user.organizationId,
        ...req.body
      });
    } else {
      Object.assign(config, req.body);
    }

    await config.save();
    res.json(config);
  } catch (error) {
    console.error('Update SMS config error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initialize Africa's Talking client
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

// Send individual SMS
router.post('/send', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { recipientId, phoneNumber, message, messageType, reminderType } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!recipientId && !phoneNumber) {
      return res.status(400).json({ message: 'Recipient ID or phone number is required' });
    }

    // Get SMS config
    const config = await SMSConfig.findOne({ organizationId: req.user.organizationId });
    if (!config) {
      return res.status(400).json({ message: 'SMS configuration not found. Please configure SMS settings first.' });
    }

    let tenant = null;
    let recipientPhone = phoneNumber;
    let recipientName = null;

    if (recipientId) {
      tenant = await Tenant.findOne({
        _id: recipientId,
        organizationId: req.user.organizationId
      });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      recipientPhone = tenant.phoneNumber;
      recipientName = `${tenant.firstName} ${tenant.lastName}`;
    }

    if (!recipientPhone) {
      return res.status(400).json({ message: 'Phone number not found' });
    }

    // Initialize Africa's Talking client
    const smsClient = getAfricasTalkingClient(config);
    const senderId = config.africasTalkingSenderId || 'TURBINE';

    // Send SMS
    const options = {
      to: recipientPhone,
      message: message,
      from: senderId
    };

    let result;
    try {
      result = await smsClient.send(options);
    } catch (smsError) {
      console.error('Africa\'s Talking API error:', smsError);
      
      // Create failed SMS record
      const smsRecord = new SMS({
        organizationId: req.user.organizationId,
        recipientType: 'single',
        recipients: [{
          tenantId: tenant?._id || null,
          phoneNumber: recipientPhone,
          name: recipientName
        }],
        message: message,
        messageType: messageType || 'manual',
        reminderType: reminderType || null,
        status: 'failed',
        successCount: 0,
        failureCount: 1,
        results: [{
          phoneNumber: recipientPhone,
          tenantId: tenant?._id || null,
          status: 'failed',
          error: smsError.message || 'SMS sending failed'
        }],
        error: smsError.message || 'SMS sending failed'
      });
      await smsRecord.save();

      return res.status(500).json({ message: 'Failed to send SMS', error: smsError.message });
    }

    // Create successful SMS record
    const smsRecord = new SMS({
      organizationId: req.user.organizationId,
      recipientType: 'single',
      recipients: [{
        tenantId: tenant?._id || null,
        phoneNumber: recipientPhone,
        name: recipientName
      }],
      message: message,
      messageType: messageType || 'manual',
      reminderType: reminderType || null,
      status: 'sent',
      successCount: 1,
      failureCount: 0,
      results: [{
        phoneNumber: recipientPhone,
        tenantId: tenant?._id || null,
        status: 'sent',
        messageId: result.SMSMessageData?.Recipients?.[0]?.messageId || null
      }],
      sentAt: new Date()
    });
    await smsRecord.save();

    res.json({
      success: true,
      message: 'SMS sent successfully',
      sms: smsRecord,
      apiResponse: result
    });
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send bulk SMS to selected tenants
router.post('/send-bulk', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { tenantIds, message, messageType, reminderType } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({ message: 'At least one tenant ID is required' });
    }

    // Get SMS config
    const config = await SMSConfig.findOne({ organizationId: req.user.organizationId });
    if (!config) {
      return res.status(400).json({ message: 'SMS configuration not found. Please configure SMS settings first.' });
    }

    // Get tenants
    const tenants = await Tenant.find({
      _id: { $in: tenantIds },
      organizationId: req.user.organizationId
    });

    if (tenants.length === 0) {
      return res.status(404).json({ message: 'No tenants found' });
    }

    // Filter tenants with phone numbers
    const tenantsWithPhones = tenants.filter(t => t.phoneNumber);

    if (tenantsWithPhones.length === 0) {
      return res.status(400).json({ message: 'No tenants with phone numbers found' });
    }

    // Initialize Africa's Talking client
    const smsClient = getAfricasTalkingClient(config);
    const senderId = config.africasTalkingSenderId || 'TURBINE';

    // Prepare recipients
    const recipients = tenantsWithPhones.map(t => ({
      tenantId: t._id,
      phoneNumber: t.phoneNumber,
      name: `${t.firstName} ${t.lastName}`
    }));

    // Send SMS to all recipients
    const phoneNumbers = recipients.map(r => r.phoneNumber);
    const options = {
      to: phoneNumbers,
      message: message,
      from: senderId
    };

    let result;
    let successCount = 0;
    let failureCount = 0;
    const results = [];

    try {
      result = await smsClient.send(options);
      
      // Process results
      if (result.SMSMessageData?.Recipients) {
        const apiResults = result.SMSMessageData.Recipients;
        
        recipients.forEach((recipient, index) => {
          const apiResult = apiResults.find(r => r.number === recipient.phoneNumber);
          
          if (apiResult && apiResult.status === 'Success') {
            successCount++;
            results.push({
              phoneNumber: recipient.phoneNumber,
              tenantId: recipient.tenantId,
              status: 'sent',
              messageId: apiResult.messageId || null
            });
          } else {
            failureCount++;
            results.push({
              phoneNumber: recipient.phoneNumber,
              tenantId: recipient.tenantId,
              status: 'failed',
              error: apiResult?.status || 'Failed'
            });
          }
        });
      } else {
        // Fallback: assume all succeeded if no detailed results
        successCount = recipients.length;
        recipients.forEach(recipient => {
          results.push({
            phoneNumber: recipient.phoneNumber,
            tenantId: recipient.tenantId,
            status: 'sent'
          });
        });
      }
    } catch (smsError) {
      console.error('Africa\'s Talking API error:', smsError);
      failureCount = recipients.length;
      recipients.forEach(recipient => {
        results.push({
          phoneNumber: recipient.phoneNumber,
          tenantId: recipient.tenantId,
          status: 'failed',
          error: smsError.message || 'SMS sending failed'
        });
      });
    }

    // Determine status
    let status = 'partial';
    if (successCount === 0) {
      status = 'failed';
    } else if (failureCount === 0) {
      status = 'sent';
    }

    // Create SMS record
    const smsRecord = new SMS({
      organizationId: req.user.organizationId,
      recipientType: 'bulk',
      recipients: recipients,
      message: message,
      messageType: messageType || 'manual',
      reminderType: reminderType || null,
      status: status,
      successCount: successCount,
      failureCount: failureCount,
      results: results,
      sentAt: status !== 'failed' ? new Date() : null,
      error: status === 'failed' ? 'All SMS failed to send' : null
    });
    await smsRecord.save();

    res.json({
      success: true,
      message: `SMS sent to ${successCount} out of ${recipients.length} recipients`,
      sms: smsRecord,
      apiResponse: result || null
    });
  } catch (error) {
    console.error('Send bulk SMS error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send SMS to all tenants
router.post('/send-all-tenants', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { message, messageType, reminderType, propertyIds } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get SMS config
    const config = await SMSConfig.findOne({ organizationId: req.user.organizationId });
    if (!config) {
      return res.status(400).json({ message: 'SMS configuration not found. Please configure SMS settings first.' });
    }

    // Get all tenants
    const query = { organizationId: req.user.organizationId, isActive: true };
    if (propertyIds && propertyIds.length > 0) {
      query.propertyId = { $in: propertyIds };
    }

    const tenants = await Tenant.find(query);

    if (tenants.length === 0) {
      return res.status(404).json({ message: 'No tenants found' });
    }

    // Filter tenants with phone numbers
    const tenantsWithPhones = tenants.filter(t => t.phoneNumber);

    if (tenantsWithPhones.length === 0) {
      return res.status(400).json({ message: 'No tenants with phone numbers found' });
    }

    // Initialize Africa's Talking client
    const smsClient = getAfricasTalkingClient(config);
    const senderId = config.africasTalkingSenderId || 'TURBINE';

    // Prepare recipients (limit to 100 per batch for Africa's Talking)
    const recipients = tenantsWithPhones.map(t => ({
      tenantId: t._id,
      phoneNumber: t.phoneNumber,
      name: `${t.firstName} ${t.lastName}`
    }));

    // Split into batches of 100
    const batchSize = 100;
    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    const allResults = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const phoneNumbers = batch.map(r => r.phoneNumber);

      const options = {
        to: phoneNumbers,
        message: message,
        from: senderId
      };

      try {
        const result = await smsClient.send(options);
        
        if (result.SMSMessageData?.Recipients) {
          const apiResults = result.SMSMessageData.Recipients;
          
          batch.forEach((recipient) => {
            const apiResult = apiResults.find(r => r.number === recipient.phoneNumber);
            
            if (apiResult && apiResult.status === 'Success') {
              totalSuccessCount++;
              allResults.push({
                phoneNumber: recipient.phoneNumber,
                tenantId: recipient.tenantId,
                status: 'sent',
                messageId: apiResult.messageId || null
              });
            } else {
              totalFailureCount++;
              allResults.push({
                phoneNumber: recipient.phoneNumber,
                tenantId: recipient.tenantId,
                status: 'failed',
                error: apiResult?.status || 'Failed'
              });
            }
          });
        }
      } catch (smsError) {
        console.error('Africa\'s Talking API error for batch:', smsError);
        batch.forEach(recipient => {
          totalFailureCount++;
          allResults.push({
            phoneNumber: recipient.phoneNumber,
            tenantId: recipient.tenantId,
            status: 'failed',
            error: smsError.message || 'SMS sending failed'
          });
        });
      }

      // Add delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Determine status
    let status = 'partial';
    if (totalSuccessCount === 0) {
      status = 'failed';
    } else if (totalFailureCount === 0) {
      status = 'sent';
    }

    // Create SMS record
    const smsRecord = new SMS({
      organizationId: req.user.organizationId,
      recipientType: 'all_tenants',
      recipients: recipients,
      message: message,
      messageType: messageType || 'manual',
      reminderType: reminderType || null,
      status: status,
      successCount: totalSuccessCount,
      failureCount: totalFailureCount,
      results: allResults,
      sentAt: status !== 'failed' ? new Date() : null,
      error: status === 'failed' ? 'All SMS failed to send' : null
    });
    await smsRecord.save();

    res.json({
      success: true,
      message: `SMS sent to ${totalSuccessCount} out of ${recipients.length} tenants`,
      sms: smsRecord
    });
  } catch (error) {
    console.error('Send SMS to all tenants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get SMS history
router.get('/history', auth, async (req, res) => {
  try {
    const { startDate, endDate, messageType, status } = req.query;
    const query = { organizationId: req.user.organizationId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (messageType) query.messageType = messageType;
    if (status) query.status = status;

    const smsHistory = await SMS.find(query)
      .populate('recipients.tenantId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(smsHistory);
  } catch (error) {
    console.error('Get SMS history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
