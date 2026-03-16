const express = require('express');
const Property = require('../models/Property');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Unit = require('../models/Unit');
const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Utility = require('../models/Utility');
const Maintenance = require('../models/Maintenance');
const PreVisit = require('../models/PreVisit');
const Complaint = require('../models/Complaint');
const Claim = require('../models/Claim');
const PropertyGroup = require('../models/PropertyGroup');
const ListingFee = require('../models/ListingFee');
const fs = require('fs');
const { auth, requireRole } = require('../middleware/auth');

const LISTING_FEE_AMOUNT = parseInt(process.env.LISTING_FEE_AMOUNT || '5000', 10);

const router = express.Router();

// Get all properties for organization
router.get('/', auth, async (req, res) => {
  try {
    // Admin can view all properties, others can only view their organization's properties
    const query = req.user.role === 'admin' && req.query.organizationId
      ? { organizationId: req.query.organizationId }
      : req.user.role === 'admin'
      ? {}
      : { organizationId: req.user.organizationId };

    const properties = await Property.find(query)
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single property
router.get('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate pricing based on number of units
const calculatePricing = async (numberOfUnits) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ price: 1 });
    
    // Find the appropriate plan based on number of units
    let selectedPlan = null;
    for (const plan of plans) {
      const maxUnits = plan.features?.maxUnits;
      if (maxUnits === null || maxUnits === undefined) {
        // Unlimited plan
        if (!selectedPlan) selectedPlan = plan;
      } else if (numberOfUnits <= maxUnits) {
        selectedPlan = plan;
        break;
      }
    }
    
    // If no plan found, use the most expensive one (enterprise)
    if (!selectedPlan && plans.length > 0) {
      selectedPlan = plans[plans.length - 1];
    }
    
    return selectedPlan ? {
      planName: selectedPlan.name,
      planPrice: selectedPlan.price,
      currency: selectedPlan.currency || 'KES',
      billingPeriod: selectedPlan.billingPeriod || 'monthly'
    } : null;
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return null;
  }
};

// Helper function to notify admin about new property
const notifyAdminForVerification = async (property) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: 'admin', isActive: true });
    
    // Get organization details
    const organization = await Organization.findById(property.organizationId);
    
    for (const admin of admins) {
      const notification = new Notification({
        recipientId: admin._id,
        recipientRole: 'admin',
        type: 'property_verification_required',
        title: 'New Property Requires Verification',
        message: `A new property "${property.propertyName}" with ${property.numberOfUnits} units has been created by ${organization?.name || 'an organization'}. Please verify the property.`,
        relatedResourceType: 'property',
        relatedResourceId: property._id,
        priority: 'high'
      });
      await notification.save();
    }
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
};

// Create property
router.post('/', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const {
      propertyName,
      numberOfUnits,
      country,
      city,
      location,
      waterRate,
      electricityRate,
      mpesaPaybill,
      mpesaTill,
      rentPaymentPenalty,
      taxRate,
      garbageBill,
      managementFee,
      streetName,
      companyName,
      notes,
      paymentInstructions,
      otherRecurringBills,
      agreedToPricing, // Frontend: for full_management
      agreedToListingFee // Frontend: for advertise_only
    } = req.body;

    if (!propertyName || !numberOfUnits || !city) {
      return res.status(400).json({ message: 'Property name, number of units, and city are required' });
    }

    const organization = await Organization.findById(req.user.organizationId).lean();
    const isAdvertiseOnly = organization?.listingType === 'advertise_only';

    if (isAdvertiseOnly) {
      // Advertise-only: require agreement to listing fee only
      if (agreedToListingFee !== true) {
        return res.status(400).json({
          message: 'You must agree to the listing fee to list this property.',
          listingFeeAmount: LISTING_FEE_AMOUNT,
          currency: 'KES'
        });
      }
    } else {
      // Full management: calculate subscription pricing and require agreement
      const calculatedPricing = await calculatePricing(parseInt(numberOfUnits));
      if (!calculatedPricing) {
        return res.status(400).json({ message: 'Unable to calculate pricing. Please contact support.' });
      }
      if (agreedToPricing !== true) {
        return res.status(400).json({
          message: 'You must agree to the pricing plan before creating the property',
          calculatedPricing
        });
      }
    }

    const propertyPayload = {
      organizationId: req.user.organizationId,
      propertyName,
      numberOfUnits: parseInt(numberOfUnits),
      country: country || 'Kenya',
      city,
      location: location || null,
      waterRate: waterRate ? parseFloat(waterRate) : null,
      electricityRate: electricityRate ? parseFloat(electricityRate) : null,
      mpesaPaybill: mpesaPaybill || null,
      mpesaTill: mpesaTill || null,
      rentPaymentPenalty: rentPaymentPenalty ? parseFloat(rentPaymentPenalty) : null,
      taxRate: taxRate ? parseFloat(taxRate) : null,
      garbageBill: garbageBill ? parseFloat(garbageBill) : null,
      managementFee: managementFee ? parseFloat(managementFee) : null,
      streetName: streetName || null,
      companyName: companyName || null,
      notes: notes || null,
      paymentInstructions: paymentInstructions || null,
      otherRecurringBills: otherRecurringBills || [],
      calculatedPricing: null
    };

    if (isAdvertiseOnly) {
      propertyPayload.listingType = 'advertise_only';
      propertyPayload.listingFeeStatus = 'pending';
      propertyPayload.isVerified = false; // Becomes true when listing fee is paid
    } else {
      propertyPayload.isVerified = false;
      propertyPayload.calculatedPricing = await calculatePricing(parseInt(numberOfUnits));
    }

    const property = new Property(propertyPayload);
    await property.save();

    if (isAdvertiseOnly) {
      const listingFee = new ListingFee({
        organizationId: req.user.organizationId,
        propertyId: property._id,
        amount: LISTING_FEE_AMOUNT,
        currency: 'KES',
        status: 'pending'
      });
      await listingFee.save();
      property._doc.listingFee = { id: listingFee._id, amount: listingFee.amount, status: listingFee.status };
    } else {
      await notifyAdminForVerification(property);
    }

    res.status(201).json(property);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update property
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    Object.assign(property, req.body);
    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify property (Admin only)
router.put('/:id/verify', auth, requireRole('admin'), async (req, res) => {
  try {
    const { verified, verificationNotes } = req.body;
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (verified === true) {
      property.isVerified = true;
      property.verifiedBy = req.user._id;
      property.verifiedAt = new Date();
      property.verificationNotes = verificationNotes || null;
      
      await property.save();
      
      // Notify the property owner
      const organization = await Organization.findById(property.organizationId);
      if (organization && organization.ownerId) {
        const notification = new Notification({
          recipientId: organization.ownerId,
          recipientRole: 'landlord',
          type: 'property_verified',
          title: 'Property Verified',
          message: `Your property "${property.propertyName}" has been verified and is now active.`,
          relatedResourceType: 'property',
          relatedResourceId: property._id,
          priority: 'medium'
        });
        await notification.save();
      }
      
      res.json({ message: 'Property verified successfully', property });
    } else {
      property.isVerified = false;
      property.verificationNotes = verificationNotes || null;
      await property.save();
      
      res.json({ message: 'Property verification updated', property });
    }
  } catch (error) {
    console.error('Verify property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pricing calculation (before creating property)
router.post('/calculate-pricing', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { numberOfUnits } = req.body;
    
    if (!numberOfUnits || numberOfUnits < 1) {
      return res.status(400).json({ message: 'Number of units is required' });
    }

    const calculatedPricing = await calculatePricing(parseInt(numberOfUnits));
    
    if (!calculatedPricing) {
      return res.status(400).json({
        message: 'No subscription plans are configured. Please ask an administrator to set up subscription plans (run: node scripts/seed-plans.js in the backend folder).'
      });
    }

    res.json({ calculatedPricing });
  } catch (error) {
    console.error('Calculate pricing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete property
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const propertyId = property._id;

    // Count related data before deletion (for response)
    const units = await Unit.find({ propertyId: propertyId });
    const unitIds = units.map(u => u._id);
    const tenants = await Tenant.find({ propertyId: propertyId });
    const invoicesCount = await Invoice.countDocuments({ propertyId: propertyId });
    const paymentsCount = await Payment.countDocuments({ propertyId: propertyId });
    const expensesCount = await Expense.countDocuments({ propertyId: propertyId });
    const utilitiesCount = await Utility.countDocuments({ propertyId: propertyId });
    const maintenanceRequests = await Maintenance.find({ propertyId: propertyId });
    const preVisitsCount = await PreVisit.countDocuments({ propertyId: propertyId });
    const complaintsCount = await Complaint.countDocuments({ propertyId: propertyId });
    const claimsCount = await Claim.countDocuments({ propertyId: propertyId });

    // Delete all related data in the correct order (to avoid foreign key issues)
    
    // 1. Delete tenants (which reference units and property)
    for (const tenant of tenants) {
      // Delete tenant uploaded files
      if (tenant.uploadedFiles && tenant.uploadedFiles.length > 0) {
        tenant.uploadedFiles.forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error('Error deleting tenant file:', err);
            }
          }
        });
      }
    }
    await Tenant.deleteMany({ propertyId: propertyId });
    
    // 2. Delete units
    await Unit.deleteMany({ propertyId: propertyId });

    // 3. Delete invoices (which reference property and tenants)
    await Invoice.deleteMany({ propertyId: propertyId });

    // 4. Delete payments (which reference invoices/property)
    await Payment.deleteMany({ propertyId: propertyId });

    // 5. Delete expenses
    await Expense.deleteMany({ propertyId: propertyId });

    // 6. Delete utilities
    await Utility.deleteMany({ propertyId: propertyId });

    // 7. Delete maintenance requests
    for (const maintenance of maintenanceRequests) {
      // Delete maintenance uploaded files
      if (maintenance.uploadedFiles && maintenance.uploadedFiles.length > 0) {
        maintenance.uploadedFiles.forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error('Error deleting maintenance file:', err);
            }
          }
        });
      }
    }
    await Maintenance.deleteMany({ propertyId: propertyId });

    // 8. Delete pre-visits
    await PreVisit.deleteMany({ propertyId: propertyId });

    // 9. Delete complaints
    await Complaint.deleteMany({ propertyId: propertyId });

    // 10. Delete claims
    await Claim.deleteMany({ propertyId: propertyId });

    // 11. Remove property from property groups
    await PropertyGroup.updateMany(
      { properties: propertyId },
      { $pull: { properties: propertyId } }
    );

    // 12. Delete notifications related to this property
    await Notification.deleteMany({ 
      relatedResourceType: 'property',
      relatedResourceId: propertyId 
    });

    // 13. Finally, delete the property itself
    await property.deleteOne();

    res.json({ 
      message: 'Property and all related data deleted successfully',
      deleted: {
        units: unitIds.length,
        tenants: tenants.length,
        invoices: invoicesCount,
        payments: paymentsCount,
        expenses: expensesCount,
        utilities: utilitiesCount,
        maintenance: maintenanceRequests.length,
        preVisits: preVisitsCount,
        complaints: complaintsCount,
        claims: claimsCount
      }
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
