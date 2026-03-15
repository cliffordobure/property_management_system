# Turbine Admin Guide

## Overview

The admin role in Turbine is the system administrator who manages the entire SaaS platform. Admins have full access to all organizations, users, properties, units, and tenants across the system.

## Admin Features

### 1. **System Statistics Dashboard**
- View overall system metrics:
  - Total Organizations
  - Total Users (by role: managers, landlords, tenants)
  - Total Properties
  - Total Units
  - Total Tenants
  - Active Users

### 2. **Organization Management**
- View all organizations in the system
- See organization details:
  - Organization Name
  - Owner Information
  - Subscription Plan
  - Status (Active/Inactive)
- Delete organizations (cascades to all related data)

### 3. **User Management**
- View all users across all organizations
- Filter users by:
  - Role (admin, manager, landlord, tenant)
  - Organization
- Activate/Deactivate users
- View user details and their associated organizations

### 4. **Cross-Organization Data Access**
- View all properties across all organizations
- View all tenants across all organizations
- Filter data by organization
- Monitor system-wide activity

### 5. **Admin User Creation**
- Create new admin users via API
- Only existing admins can create new admins

## Accessing the Admin Dashboard

1. **Login as Admin**: Use your admin credentials at `/login`
2. **Navigate to Admin Dashboard**: Automatically redirected to `/admin` after login
3. **URL**: `http://localhost:3000/admin`

## Creating an Admin User

### Seeding Super Admin (Recommended - First Time Setup)

Create a super admin directly in the database using the seed script:

```bash
cd backend
npm run seed-admin
```

This creates a super admin with:
- **Email**: `admin@turbine.com` (default, can be changed in `.env`)
- **Password**: `admin123` (default, can be changed in `.env`)
- **Role**: `admin`
- **Status**: Active, onboarding completed

**Customize credentials** by adding to `backend/.env`:
```env
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=your-secure-password
SUPER_ADMIN_FIRST_NAME=Your
SUPER_ADMIN_LAST_NAME=Name
```

### Creating Additional Admins via API

Once logged in as an admin, you can create additional admins via API:

```bash
POST http://localhost:5000/api/admin/create-admin
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "email": "newadmin@turbine.com",
  "password": "admin123",
  "firstName": "New",
  "lastName": "Admin"
}
```

### Via Admin Dashboard UI

Admins can create other admins through the admin dashboard interface (feature can be added to the UI).

## Admin API Endpoints

### Statistics
- `GET /api/admin/stats` - Get system-wide statistics

### Organizations
- `GET /api/admin/organizations` - Get all organizations
- `DELETE /api/admin/organizations/:id` - Delete organization (cascades to related data)

### Users
- `GET /api/admin/users` - Get all users (optional: `?role=tenant`, `?organizationId=...`)
- `POST /api/admin/create-admin` - Create new admin user
- `PUT /api/admin/users/:id/status` - Update user status (activate/deactivate)

### Cross-Organization Access
- `GET /api/properties?organizationId=...` - View properties (admin can omit organizationId to see all)
- `GET /api/tenants?organizationId=...` - View tenants (admin can omit organizationId to see all)

## Admin Responsibilities

### System Monitoring
- Monitor system usage and growth
- Track number of organizations, users, and properties
- Identify active vs inactive users

### User Management
- Activate/deactivate user accounts
- Help resolve user access issues
- Monitor user roles and permissions

### Organization Management
- Manage organizations and their subscriptions
- Delete organizations if needed (cascades to all data)
- Monitor organization activity

### Support & Troubleshooting
- Help resolve tenant linking issues
- Manage system-wide problems
- Provide support to managers/landlords

### Security
- Monitor system security
- Manage admin accounts
- Review user activities

## Common Admin Tasks

### Helping a Tenant Who Can't Access Dashboard

1. Check if tenant user account exists:
   - Go to Admin Dashboard → Users
   - Filter by role "tenant"
   - Search for tenant's email

2. Check if tenant record exists:
   - Check tenant's organization
   - Look for tenant record with matching email

3. Link tenant if needed:
   - Edit tenant record
   - Ensure email matches user account
   - System should auto-link, or use API to link manually

### Deactivating a User

1. Go to Admin Dashboard → Users
2. Find the user
3. Toggle their status (Active ↔ Inactive)
4. Inactive users cannot log in

### Deleting an Organization

⚠️ **Warning**: This permanently deletes:
- All properties
- All units
- All tenants
- All related data

1. Go to Admin Dashboard → Organizations
2. Find the organization
3. Use the API endpoint to delete:
   ```bash
   DELETE /api/admin/organizations/:id
   ```

## Admin Best Practices

1. **Regular Monitoring**: Check system stats regularly to monitor growth
2. **User Management**: Review user status and activity periodically
3. **Security**: Keep admin credentials secure and rotate passwords
4. **Documentation**: Document any system-wide changes or issues
5. **Support**: Respond promptly to user access issues

## Future Admin Features (Planned)

- Bulk user management
- Advanced analytics and reporting
- System configuration management
- Audit logs
- Email notifications management
- Subscription plan management interface
- Data export capabilities
