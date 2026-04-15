const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turbine';

const defaultPlans = [
  {
    name: 'free',
    displayName: 'Free Plan',
    description: 'Perfect for getting started with basic property management',
    price: 0,
    currency: 'KES',
    billingPeriod: 'monthly',
    features: {
      maxProperties: 1,
      maxUnits: 10,
      maxTenants: 20,
      maxUsers: 2,
      smsIncluded: 0,
      supportLevel: 'basic',
      advancedReports: false,
      apiAccess: false,
      customBranding: false
    },
    isActive: true,
    isDefault: true
  },
  {
    name: 'basic',
    displayName: 'Basic Plan',
    description: 'Ideal for small property portfolios',
    price: 5000,
    currency: 'KES',
    billingPeriod: 'monthly',
    features: {
      maxProperties: 5,
      maxUnits: 50,
      maxTenants: 100,
      maxUsers: 5,
      smsIncluded: 100,
      supportLevel: 'basic',
      advancedReports: false,
      apiAccess: false,
      customBranding: false
    },
    isActive: true,
    isDefault: false
  },
  {
    name: 'premium',
    displayName: 'Premium Plan',
    description: 'For growing property management businesses',
    price: 15000,
    currency: 'KES',
    billingPeriod: 'monthly',
    features: {
      maxProperties: 20,
      maxUnits: 200,
      maxTenants: 500,
      maxUsers: 15,
      smsIncluded: 500,
      supportLevel: 'priority',
      advancedReports: true,
      apiAccess: false,
      customBranding: false
    },
    isActive: true,
    isDefault: false
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise Plan',
    description: 'Unlimited features for large-scale operations',
    price: 50000,
    currency: 'KES',
    billingPeriod: 'monthly',
    features: {
      maxProperties: null, // Unlimited
      maxUnits: null,
      maxTenants: null,
      maxUsers: null,
      smsIncluded: 2000,
      supportLevel: 'dedicated',
      advancedReports: true,
      apiAccess: true,
      customBranding: true
    },
    isActive: true,
    isDefault: false
  }
];

async function seedPlans() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB');

    // Clear existing plans (optional - comment out if you want to keep existing)
    // await SubscriptionPlan.deleteMany({});

    for (const planData of defaultPlans) {
      const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });
      
      if (existingPlan) {
        console.log(`Plan ${planData.name} already exists, updating...`);
        await SubscriptionPlan.updateOne({ name: planData.name }, planData);
      } else {
        console.log(`Creating plan ${planData.name}...`);
        const plan = new SubscriptionPlan(planData);
        await plan.save();
      }
    }

    console.log('Subscription plans seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  }
}

seedPlans();
