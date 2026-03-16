# Tongi Mobile App

Flutter mobile app for **tenants**, **landlords**, and **caretakers** (managers), connected to your hosted property management API.

## Features

- **Tenant**: Dashboard, Invoices, Payments, Maintenance requests, Complaints, Profile
- **Landlord / Caretaker**: Dashboard, Properties, Tenants, Invoices, Payments, Maintenance, Profile
- **Auth**: Login and Register with role selection (Landlord/Caretaker vs Tenant)
- **API**: Uses your production backend at `https://property-management-system-w07h.onrender.com/api`

## Prerequisites

- [Flutter SDK](https://flutter.dev/docs/get-started/install) (3.2+)
- Android Studio / Xcode for running on device or simulator

## Setup

1. **Generate platform folders** (if not already present):

   ```bash
   cd mobile
   flutter create . --project-name tongi_app
   ```

2. **Install dependencies**:

   ```bash
   flutter pub get
   ```

3. **Run the app**:

   ```bash
   flutter run
   ```

## Configuration

- **API base URL** is set in `lib/config/api_config.dart`. Default is your production API. To override at build time:

  ```bash
  flutter run --dart-define=API_BASE_URL=https://your-api.com/api
  ```

- Ensure your backend allows requests from the app. Mobile apps often do not send an `Origin` header, so CORS may not apply; if you use a proxy or web build, add the appropriate origin to your backend CORS config.

## Project structure

```
lib/
├── config/          # API base URL
├── models/          # User model
├── providers/       # Auth state (Provider)
├── screens/
│   ├── auth/        # Login, Register
│   ├── tenant/      # Tenant dashboard, invoices, payments, maintenance, complaints, profile
│   └── landlord/    # Landlord/Caretaker dashboard, properties, tenants, invoices, payments, maintenance, profile
├── services/        # API client, Auth service
├── theme/           # App theme
└── main.dart
```

## Roles

- **Tenant**: Log in with "Tenant"; see only own invoices, payments, maintenance, complaints.
- **Landlord**: Register or log in as "Landlord / Caretaker"; manage properties, tenants, invoices, payments, maintenance.
- **Caretaker (Manager)**: Log in as "Landlord / Caretaker" (backend role `manager`); same as landlord. Caretakers are created by landlords in the web app.

## Build for release

- **Android**: `flutter build apk` or `flutter build appbundle`
- **iOS**: `flutter build ios` (then open Xcode for signing and archive)
