# Tenant Account Linking Guide

## How Tenant Accounts Work in Turbine

In Turbine, there are two separate but related concepts:

1. **User Account** - Created when a tenant registers on the platform
2. **Tenant Record** - Created by managers/landlords when adding a tenant to a property

These need to be **linked** for the tenant to access their dashboard.

## How Linking Works

### Automatic Linking (Recommended)

When a manager/landlord adds a tenant and provides an **email address**:

1. The system checks if a user account exists with that email and role 'tenant'
2. If found, it automatically links the tenant record to that user account
3. The tenant can then log in and see their dashboard

**Steps:**
1. Tenant registers at `/login` (chooses "Tenant" role)
2. Manager adds tenant via "Add Tenant" form
3. Manager enters the **same email** the tenant used to register
4. System automatically links them ✅

### Manual Linking (If Needed)

If a tenant record was created without an email, or with a different email:

1. Go to the tenant's details/edit page
2. Update the email field to match the tenant's registered email
3. The system will automatically link them on save

## Current Issue: "Tenant information not found"

This error appears when:
- A tenant user account exists (they can log in)
- But no tenant record is linked to their user account

### Solution Options:

#### Option 1: Manager Adds Tenant with Matching Email (Easiest)
1. Manager logs in
2. Goes to "Add Tenant"
3. Fills in tenant details
4. **Important:** Enters the tenant's registered email address
5. System automatically links them

#### Option 2: Update Existing Tenant Record
1. Manager finds the tenant record in the property details
2. Edits the tenant
3. Adds/updates the email to match the tenant's registered email
4. System automatically links them

#### Option 3: Use API Endpoint (For Admins)
```bash
PUT /api/tenants/:tenantId/link-user
Body: { "email": "tenant@example.com" }
```

## Best Practice Workflow

**For Managers/Landlords:**
1. Ask tenants to register first (or register them yourself)
2. When adding tenant to property, use the **exact same email** they registered with
3. System handles the linking automatically

**For Tenants:**
1. Register with your email
2. Wait for your manager to add you to a property
3. Make sure they use your registered email
4. Once linked, you can access your dashboard

## Troubleshooting

**Q: Tenant registered but can't see dashboard?**
- Check if manager added them with matching email
- If not, manager should edit tenant record and add email

**Q: Email already linked to another tenant?**
- One email can only be linked to one tenant record
- Use a different email or contact support

**Q: Tenant record exists but no user account?**
- Tenant needs to register first at `/login`
- Then manager can link them using the email

## Technical Details

- Linking happens via the `userId` field in the Tenant model
- Email matching is case-insensitive
- Only tenant role users can be linked
- One user account can only link to one tenant record
