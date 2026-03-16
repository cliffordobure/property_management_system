const express = require('express');
const ListingFee = require('../models/ListingFee');
const Property = require('../models/Property');
const Organization = require('../models/Organization');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const LISTING_FEE_AMOUNT = parseInt(process.env.LISTING_FEE_AMOUNT || '5000', 10);

// Get listing fee amount (public for landing/register; auth for dashboard)
router.get('/config', (req, res) => {
  res.json({
    amount: LISTING_FEE_AMOUNT,
    currency: 'KES',
    description: 'One-time fee per property to list on Fancyfy'
  });
});

// List my organization's listing fees
router.get('/', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' && req.query.organizationId
      ? { organizationId: req.query.organizationId }
      : { organizationId: req.user.organizationId };
    const fees = await ListingFee.find(query)
      .populate('propertyId', 'propertyName city location listingFeeStatus')
      .sort({ createdAt: -1 });
    res.json(fees);
  } catch (error) {
    console.error('List listing fees error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get listing fee for a property
router.get('/property/:propertyId', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.propertyId,
      organizationId: req.user.organizationId
    });
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    const fee = await ListingFee.findOne({ propertyId: property._id })
      .populate('propertyId', 'propertyName city location listingFeeStatus');
    if (!fee) {
      return res.status(404).json({ message: 'No listing fee found for this property' });
    }
    res.json(fee);
  } catch (error) {
    console.error('Get listing fee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record payment for a listing fee (landlord/manager submits payment details)
router.post('/:id/pay', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const listingFee = await ListingFee.findById(req.params.id)
      .populate('propertyId');
    if (!listingFee) {
      return res.status(404).json({ message: 'Listing fee not found' });
    }
    if (listingFee.organizationId.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({ message: 'Not allowed to pay this listing fee' });
    }
    if (listingFee.status === 'paid') {
      return res.status(400).json({ message: 'This listing fee is already paid' });
    }

    const { paymentMethod, paymentReference, notes } = req.body;
    listingFee.status = 'paid';
    listingFee.paidAt = new Date();
    listingFee.paymentMethod = paymentMethod || 'other';
    listingFee.paymentReference = paymentReference || null;
    listingFee.notes = notes || null;
    await listingFee.save();

    const property = await Property.findById(listingFee.propertyId._id || listingFee.propertyId);
    if (property) {
      property.listingFeeStatus = 'paid';
      property.listingFeePaidAt = new Date();
      property.isVerified = true; // Listed properties are visible on public listing
      await property.save();
    }

    res.json({
      message: 'Payment recorded. Your property is now listed.',
      listingFee,
      property: property ? { listingFeeStatus: property.listingFeeStatus, isVerified: property.isVerified } : null
    });
  } catch (error) {
    console.error('Pay listing fee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
