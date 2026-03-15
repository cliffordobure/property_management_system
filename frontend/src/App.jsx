import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './store/slices/authSlice';
import PrivateRoute from './utils/PrivateRoute.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TenantDashboard from './pages/TenantDashboard.jsx';
import AddPropertyPage from './pages/AddPropertyPage.jsx';
import AddUnitPage from './pages/AddUnitPage.jsx';
import AddTenantPage from './pages/AddTenantPage.jsx';
import PropertyDetailsPage from './pages/PropertyDetailsPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
// Navigation pages
import TenantsPage from './pages/TenantsPage.jsx';
import TenantDetailsPage from './pages/TenantDetailsPage.jsx';
import UnitsPage from './pages/UnitsPage.jsx';
import InvoicesPage from './pages/InvoicesPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import CommunicationPage from './pages/CommunicationPage.jsx';
import UtilitiesPage from './pages/UtilitiesPage.jsx';
import MaintenancePage from './pages/MaintenancePage.jsx';
import PropertyGroupingPage from './pages/PropertyGroupingPage.jsx';
import SettingsProfilePage from './pages/SettingsProfilePage.jsx';
import SettingsPreferencesPage from './pages/SettingsPreferencesPage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import TutorialsPage from './pages/TutorialsPage.jsx';
// Tenant pages
import TenantComplaintsPage from './pages/TenantComplaintsPage.jsx';
import TenantClaimsPage from './pages/TenantClaimsPage.jsx';
import TenantInvoicesPage from './pages/TenantInvoicesPage.jsx';
import TenantPaymentsPage from './pages/TenantPaymentsPage.jsx';
import TenantMaintenancePage from './pages/TenantMaintenancePage.jsx';
// Admin pages
import AdminPlansPage from './pages/AdminPlansPage.jsx';
import AdminOrganizationsPage from './pages/AdminOrganizationsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminSystemSettingsPage from './pages/AdminSystemSettingsPage.jsx';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage.jsx';
import AdminSubscriptionInvoicesPage from './pages/AdminSubscriptionInvoicesPage.jsx';
import ManagersPage from './pages/ManagersPage.jsx';
import OverdueItemsPage from './pages/OverdueItemsPage.jsx';
import BankAccountsPage from './pages/BankAccountsPage.jsx';
import ClaimsComplaintsPage from './pages/ClaimsComplaintsPage.jsx';

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [token, user, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/welcome"
          element={
            <PrivateRoute>
              <WelcomePage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <OnboardingPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/tenant-dashboard"
          element={
            <PrivateRoute allowedRoles={['tenant']}>
              <TenantDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/properties/add"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <AddPropertyPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/properties/:id"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <PropertyDetailsPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/units/add"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <AddUnitPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/tenants/add"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <AddTenantPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminPlansPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/organizations"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminOrganizationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/system-settings"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminSystemSettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminAuditLogsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscription-invoices"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminSubscriptionInvoicesPage />
            </PrivateRoute>
          }
        />
        
        {/* Financials Routes */}
        <Route
          path="/financials/invoices"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <InvoicesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/financials/payments"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <PaymentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/financials/expenses"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <ExpensesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/financials/bank-accounts"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <BankAccountsPage />
            </PrivateRoute>
          }
        />
        
        {/* Tenants Route */}
        <Route
          path="/tenants/:id"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <TenantDetailsPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/tenants"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <TenantsPage />
            </PrivateRoute>
          }
        />
        
        {/* Property/Unit Routes */}
        <Route
          path="/units"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <UnitsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/utilities"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <UtilitiesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <MaintenancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/property-grouping"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <PropertyGroupingPage />
            </PrivateRoute>
          }
        />
        
        {/* Reports Route */}
        <Route
          path="/reports"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <ReportsPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/overdue"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <OverdueItemsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/claims-complaints"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <ClaimsComplaintsPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/managers"
          element={
            <PrivateRoute allowedRoles={['landlord', 'admin']}>
              <ManagersPage />
            </PrivateRoute>
          }
        />
        
        {/* Communication Route */}
        <Route
          path="/communication"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <CommunicationPage />
            </PrivateRoute>
          }
        />
        
        {/* Settings Routes */}
        <Route
          path="/settings/profile"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <SettingsProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/preferences"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin']}>
              <SettingsPreferencesPage />
            </PrivateRoute>
          }
        />
        
        {/* Support and Tutorials Routes */}
        <Route
          path="/support"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin', 'tenant']}>
              <SupportPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tutorials"
          element={
            <PrivateRoute allowedRoles={['manager', 'landlord', 'admin', 'tenant']}>
              <TutorialsPage />
            </PrivateRoute>
          }
        />
        
        {/* Tenant Routes */}
        <Route
          path="/tenant/complaints"
          element={
            <PrivateRoute allowedRoles={['tenant']}>
              <TenantComplaintsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant/claims"
          element={
            <PrivateRoute allowedRoles={['tenant']}>
              <TenantClaimsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant/invoices"
          element={
            <PrivateRoute allowedRoles={['tenant']}>
              <TenantInvoicesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant/payments"
          element={
            <PrivateRoute allowedRoles={['tenant']}>
              <TenantPaymentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant/maintenance"
          element={
            <PrivateRoute allowedRoles={['tenant']}>
              <TenantMaintenancePage />
            </PrivateRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
