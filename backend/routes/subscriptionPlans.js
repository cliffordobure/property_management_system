const express = require('express');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public endpoint: Get active subscription plans (for landing page)
router.get('/public', async (req, res) => {
  try {
    console.log('Public pricing plans endpoint hit');
    const plans = await SubscriptionPlan.find({ isActive: true })
      .select('_id name displayName description price currency billingPeriod features')
      .sort({ price: 1 })
      .lean(); // Use lean() for better performance
    
    console.log(`Found ${plans.length} active plans`);
    plans.forEach(p => {
      console.log(`- ${p.name} (${p.displayName}): ${p.price} ${p.currency || 'KES'}, isActive: ${p.isActive}`);
    });
    
    res.json(plans);
  } catch (error) {
    console.error('Get public subscription plans error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// All routes below require admin role
router.use(auth);
router.use(requireRole('admin'));

// Get all subscription plans (admin only)
router.get('/', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single subscription plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    res.json(plan);
  } catch (error) {
    console.error('Get subscription plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create subscription plan
router.post('/', async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      price,
      currency,
      billingPeriod,
      features,
      isActive,
      isDefault
    } = req.body;

    if (!name || !displayName || price === undefined) {
      return res.status(400).json({ message: 'Name, display name, and price are required' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await SubscriptionPlan.updateMany({ isDefault: true }, { isDefault: false });
    }

    const plan = new SubscriptionPlan({
      name,
      displayName,
      description,
      price,
      currency: currency || 'KES',
      billingPeriod: billingPeriod || 'monthly',
      features: features || {},
      isActive: isActive !== undefined ? isActive : true,
      isDefault: isDefault || false
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    console.error('Create subscription plan error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Plan name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update subscription plan
router.put('/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    const {
      displayName,
      description,
      price,
      currency,
      billingPeriod,
      features,
      isActive,
      isDefault
    } = req.body;

    if (displayName) plan.displayName = displayName;
    if (description !== undefined) plan.description = description;
    if (price !== undefined) plan.price = price;
    if (currency) plan.currency = currency;
    if (billingPeriod) plan.billingPeriod = billingPeriod;
    if (features) plan.features = { ...plan.features, ...features };
    if (isActive !== undefined) plan.isActive = isActive;

    // If setting as default, unset other defaults
    if (isDefault && !plan.isDefault) {
      await SubscriptionPlan.updateMany({ isDefault: true }, { isDefault: false });
      plan.isDefault = true;
    } else if (!isDefault && plan.isDefault) {
      plan.isDefault = false;
    }

    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete subscription plan
router.delete('/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    if (plan.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default plan' });
    }

    await plan.deleteOne();
    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
