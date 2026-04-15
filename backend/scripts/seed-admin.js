const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// User model
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'landlord', 'tenant'],
    required: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  isFirstTimeLogin: {
    type: Boolean,
    default: false
  },
  howDidYouHearAboutUs: {
    type: String,
    default: null
  },
  onboardingCompleted: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

async function seedSuperAdmin() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turbine';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Default super admin credentials
    const superAdmin = {
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@gmail.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'System',
      lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Admin',
      isFirstTimeLogin: false,
      onboardingCompleted: true,
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: superAdmin.email });
    
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('⚠️  Super admin already exists with email:', superAdmin.email);
        console.log('   To create a new super admin, use a different email or delete the existing one.');
        process.exit(0);
      } else {
        console.log('⚠️  User exists but is not an admin. Updating to admin...');
        existingAdmin.role = 'admin';
        existingAdmin.isFirstTimeLogin = false;
        existingAdmin.onboardingCompleted = true;
        existingAdmin.isActive = true;
        if (superAdmin.password) {
          existingAdmin.password = await bcrypt.hash(superAdmin.password, 10);
        }
        await existingAdmin.save();
        console.log('✅ User updated to super admin');
      }
    } else {
      // Create new super admin
      const admin = new User(superAdmin);
      await admin.save();
      console.log('✅ Super admin created successfully!');
    }

    // Display admin info
    const adminUser = await User.findOne({ email: superAdmin.email });
    console.log('\n📧 Super Admin Credentials:');
    console.log('   Email:', adminUser.email);
    console.log('   Password:', superAdmin.password);
    console.log('   Role:', adminUser.role);
    console.log('\n🔐 Login at: http://localhost:3000/login');
    console.log('   Select "Manager/Landlord" and use the credentials above\n');

  } catch (error) {
    console.error('❌ Error seeding super admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the seed function
seedSuperAdmin();
