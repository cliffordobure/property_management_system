# Database Seed Scripts

## Seed Super Admin

This script creates a super admin user directly in the database.

### Usage

```bash
cd backend
npm run seed-admin
```

### Default Credentials

- **Email**: `admin@turbine.com`
- **Password**: `admin123`
- **Name**: Super Admin

### Customizing Credentials

Add these environment variables to `backend/.env`:

```env
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=your-secure-password
SUPER_ADMIN_FIRST_NAME=Your
SUPER_ADMIN_LAST_NAME=Name
```

### What It Does

1. Connects to MongoDB using `MONGODB_URI` from `.env`
2. Checks if an admin with the email already exists
3. If exists and is already admin, shows a message
4. If exists but not admin, updates the user to admin
5. If doesn't exist, creates a new super admin user
6. Displays the credentials for login

### Notes

- Passwords are automatically hashed using bcrypt
- The super admin is created with:
  - `isFirstTimeLogin: false`
  - `onboardingCompleted: true`
  - `isActive: true`
- The script is safe to run multiple times (won't duplicate admins)

## seed-plans.js

Creates default subscription plans in the database.

### Usage

```bash
cd backend
node scripts/seed-plans.js
```

### Default Plans

- **Free Plan** (KES 0/month) - 1 property, 10 units, 20 tenants, 2 users
- **Basic Plan** (KES 5,000/month) - 5 properties, 50 units, 100 tenants, 5 users, 100 SMS/month
- **Premium Plan** (KES 15,000/month) - 20 properties, 200 units, 500 tenants, 15 users, 500 SMS/month, advanced reports
- **Enterprise Plan** (KES 50,000/month) - Unlimited properties/units/tenants/users, 2000 SMS/month, priority support, API access, custom branding

### What It Does

1. Connects to MongoDB using `MONGODB_URI` from `.env`
2. Checks if each plan already exists
3. If exists, updates the plan
4. If doesn't exist, creates a new plan
5. Sets the Free plan as the default plan

### Notes

- The script is safe to run multiple times (will update existing plans)
- Plans can be managed through the Admin Portal after seeding
