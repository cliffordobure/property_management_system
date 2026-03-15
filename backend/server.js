const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
// CORS configuration - always allow Vercel frontends; add localhost in development
const allowedOrigins = [
  'https://property-management-system-gray.vercel.app',
  'https://property-management-system-6xtr653tq.vercel.app'
];
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const u = url.trim();
    if (u && !allowedOrigins.includes(u)) allowedOrigins.push(u);
  });
}
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
}
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));   

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/units', require('./routes/units'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/utilities', require('./routes/utilities'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/property-groups', require('./routes/propertyGroups'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/preferences', require('./routes/preferences'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/pre-visits', require('./routes/preVisits'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/managers', require('./routes/managers'));
app.use('/api/overdue', require('./routes/overdue'));
app.use('/api/subscription-invoices', require('./routes/subscriptionInvoices'));
app.use('/api/tenant-sms-permissions', require('./routes/tenantSMSPermissions'));
app.use('/api/bank-accounts', require('./routes/bankAccounts'));
app.use('/api/payment-verification', require('./routes/paymentVerification'));

// Public subscription plans endpoint (must be before admin routes)
const SubscriptionPlan = require('./models/SubscriptionPlan');
app.get('/api/subscription-plans/public', async (req, res) => {
  try {
    console.log('Public pricing plans endpoint hit');
    const plans = await SubscriptionPlan.find({ isActive: true })
      .select('_id name displayName description price currency billingPeriod features')
      .sort({ price: 1 })
      .lean();
    
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

app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/subscription-plans', require('./routes/subscriptionPlans'));
app.use('/api/admin/audit-logs', require('./routes/auditLogs'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turbine';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Initialize automatic SMS reminder scheduler
const { processAutomaticRentReminders } = require('./utils/smsReminderScheduler');

// Schedule automatic SMS reminders to run every 6 hours
// This ensures reminders are sent at appropriate times
setInterval(() => {
  processAutomaticRentReminders().catch(err => {
    console.error('Error in scheduled SMS reminder job:', err);
  });
}, 6 * 60 * 60 * 1000); // Every 6 hours

// Also run immediately on server start (for testing)
// In production, you might want to remove this or run it after a delay
setTimeout(() => {
  processAutomaticRentReminders().catch(err => {
    console.error('Error in initial SMS reminder check:', err);
  });
}, 30000); // Run after 30 seconds

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Automatic SMS reminder scheduler initialized');
});
