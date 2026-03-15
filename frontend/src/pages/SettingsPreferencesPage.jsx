import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPreferences, updatePreferences } from '../store/slices/preferencesSlice';
import Sidebar from '../components/Sidebar';

const SettingsPreferencesPage = () => {
  const dispatch = useDispatch();
  const { preferences, loading, error } = useSelector((state) => state.preferences);

  const [formData, setFormData] = useState({
    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    invoiceNotifications: true,
    paymentNotifications: true,
    maintenanceNotifications: true,
    // Display
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'KES',
    // Dashboard
    dashboardWidgets: ['revenue', 'expenses', 'properties', 'tenants'],
    defaultView: 'dashboard',
    // Other
    itemsPerPage: 20
  });

  const [message, setMessage] = useState('');

  useEffect(() => {
    dispatch(fetchPreferences());
  }, [dispatch]);

  useEffect(() => {
    if (preferences) {
      setFormData({
        emailNotifications: preferences.emailNotifications !== false,
        smsNotifications: preferences.smsNotifications !== false,
        invoiceNotifications: preferences.invoiceNotifications !== false,
        paymentNotifications: preferences.paymentNotifications !== false,
        maintenanceNotifications: preferences.maintenanceNotifications !== false,
        theme: preferences.theme || 'light',
        language: preferences.language || 'en',
        dateFormat: preferences.dateFormat || 'MM/DD/YYYY',
        timeFormat: preferences.timeFormat || '12h',
        currency: preferences.currency || 'KES',
        dashboardWidgets: preferences.dashboardWidgets || ['revenue', 'expenses', 'properties', 'tenants'],
        defaultView: preferences.defaultView || 'dashboard',
        itemsPerPage: preferences.itemsPerPage || 20
      });
    }
  }, [preferences]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleWidgetToggle = (widget) => {
    setFormData(prev => {
      const widgets = prev.dashboardWidgets || [];
      if (widgets.includes(widget)) {
        return { ...prev, dashboardWidgets: widgets.filter(w => w !== widget) };
      } else {
        return { ...prev, dashboardWidgets: [...widgets, widget] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const result = await dispatch(updatePreferences(formData));
      if (updatePreferences.rejected.match(result)) {
        setMessage(result.payload || 'Failed to update preferences');
        return;
      }

      setMessage('Preferences updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Update preferences error:', err);
      setMessage('An error occurred while updating preferences. Please try again.');
    }
  };

  const availableWidgets = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'properties', label: 'Properties' },
    { id: 'tenants', label: 'Tenants' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'maintenance', label: 'Maintenance' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Preferences
              </h1>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Messages */}
            {message && (
              <div className={`px-4 py-3 rounded ${
                message.includes('successfully') 
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Notification Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">Email Notifications</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="smsNotifications"
                    checked={formData.smsNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">SMS Notifications</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="invoiceNotifications"
                    checked={formData.invoiceNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">Invoice Notifications</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="paymentNotifications"
                    checked={formData.paymentNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">Payment Notifications</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="maintenanceNotifications"
                    checked={formData.maintenanceNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">Maintenance Notifications</span>
                </label>
              </div>
            </div>

            {/* Display Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Display Preferences</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select
                    name="dateFormat"
                    value={formData.dateFormat}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Format
                  </label>
                  <select
                    name="timeFormat"
                    value={formData.timeFormat}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="12h">12 Hour (AM/PM)</option>
                    <option value="24h">24 Hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="KES">KES (Kenyan Shilling)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items Per Page
                  </label>
                  <select
                    name="itemsPerPage"
                    value={formData.itemsPerPage}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dashboard Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default View
                  </label>
                  <select
                    name="defaultView"
                    value={formData.defaultView}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="properties">Properties</option>
                    <option value="tenants">Tenants</option>
                    <option value="invoices">Invoices</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dashboard Widgets
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableWidgets.map((widget) => (
                      <label key={widget.id} className="flex items-center gap-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.dashboardWidgets?.includes(widget.id)}
                          onChange={() => handleWidgetToggle(widget.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{widget.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default SettingsPreferencesPage;
