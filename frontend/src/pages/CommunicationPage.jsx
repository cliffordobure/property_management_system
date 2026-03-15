import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSMSConfig, updateSMSConfig, sendSMS, sendBulkSMS, sendSMSToAllTenants, fetchSMSHistory } from '../store/slices/smsSlice';
import { fetchTenants } from '../store/slices/tenantSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useMobileMenu } from '../hooks/useMobileMenu';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CommunicationPage = () => {
  const dispatch = useDispatch();
  const { config, history, loading, error } = useSelector((state) => state.sms);
  const { tenants } = useSelector((state) => state.tenants);
  const { properties } = useSelector((state) => state.properties);

  const [activeTab, setActiveTab] = useState('send');
  const [showConfig, setShowConfig] = useState(false);

  // SMS Form States
  const [smsType, setSmsType] = useState('single'); // single, bulk, all
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedProperties, setSelectedProperties] = useState([]);

  // Config Form State
  const [configForm, setConfigForm] = useState({
    africasTalkingApiKey: '',
    africasTalkingUsername: '',
    africasTalkingSenderId: 'TURBINE',
    autoRemindersEnabled: false,
    rentDueReminderEnabled: false,
    rentDueReminderDays: 3,
    invoiceOverdueReminderEnabled: false,
    invoiceOverdueReminderDays: 7,
    leaseExpiryReminderEnabled: false,
    leaseExpiryReminderDays: 30,
    paymentConfirmationEnabled: true,
    automaticRentRemindersEnabled: false,
    rentReminderDaysBefore: 2,
    rentReminderDaysAfter: 30,
    overdueDailySMSEnabled: true,
    overdueSMSFrequency: 2
  });

  // Tenant SMS Permissions State
  const [tenantPermissions, setTenantPermissions] = useState([]);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedTenantForPermission, setSelectedTenantForPermission] = useState(null);
  const [permissionForm, setPermissionForm] = useState({
    disabled: false,
    disabledUntil: '',
    reason: ''
  });

  useEffect(() => {
    dispatch(fetchSMSConfig());
    dispatch(fetchTenants());
    dispatch(fetchProperties());
    dispatch(fetchSMSHistory());
    fetchTenantPermissions();
  }, [dispatch]);

  const fetchTenantPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tenant-sms-permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenantPermissions(response.data);
    } catch (error) {
      console.error('Error fetching tenant permissions:', error);
    }
  };

  useEffect(() => {
    if (config) {
      setConfigForm({
        africasTalkingApiKey: config.africasTalkingApiKey || '',
        africasTalkingUsername: config.africasTalkingUsername || '',
        africasTalkingSenderId: config.africasTalkingSenderId || 'TURBINE',
        autoRemindersEnabled: config.autoRemindersEnabled || false,
        rentDueReminderEnabled: config.rentDueReminderEnabled || false,
        rentDueReminderDays: config.rentDueReminderDays || 3,
        invoiceOverdueReminderEnabled: config.invoiceOverdueReminderEnabled || false,
        invoiceOverdueReminderDays: config.invoiceOverdueReminderDays || 7,
        leaseExpiryReminderEnabled: config.leaseExpiryReminderEnabled || false,
        leaseExpiryReminderDays: config.leaseExpiryReminderDays || 30,
        paymentConfirmationEnabled: config.paymentConfirmationEnabled !== false,
        automaticRentRemindersEnabled: config.automaticRentRemindersEnabled || false,
        rentReminderDaysBefore: config.rentReminderDaysBefore || 2,
        rentReminderDaysAfter: config.rentReminderDaysAfter || 30,
        overdueDailySMSEnabled: config.overdueDailySMSEnabled !== false,
        overdueSMSFrequency: config.overdueSMSFrequency || 2
      });
    }
  }, [config]);

  const handleTenantToggle = (tenantId) => {
    setSelectedTenants(prev => {
      if (prev.includes(tenantId)) {
        return prev.filter(id => id !== tenantId);
      } else {
        return [...prev, tenantId];
      }
    });
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveConfig = async () => {
    try {
      const result = await dispatch(updateSMSConfig(configForm));
      if (updateSMSConfig.rejected.match(result)) {
        alert(result.payload || 'Failed to save SMS configuration');
        return;
      }
      alert('SMS configuration saved successfully!');
      setShowConfig(false);
    } catch (err) {
      console.error('Config save error:', err);
      alert('An error occurred while saving configuration. Please try again.');
    }
  };

  const handleSendSMS = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      let result;

      if (smsType === 'single') {
        if (!selectedTenant && !phoneNumber) {
          alert('Please select a tenant or enter a phone number');
          return;
        }

        result = await dispatch(sendSMS({
          recipientId: selectedTenant || null,
          phoneNumber: phoneNumber || null,
          message: message
        }));
      } else if (smsType === 'bulk') {
        if (selectedTenants.length === 0) {
          alert('Please select at least one tenant');
          return;
        }

        result = await dispatch(sendBulkSMS({
          tenantIds: selectedTenants,
          message: message
        }));
      } else if (smsType === 'all') {
        result = await dispatch(sendSMSToAllTenants({
          message: message,
          propertyIds: selectedProperties.length > 0 ? selectedProperties : null
        }));
      }

      if (result && (sendSMS.rejected.match(result) || sendBulkSMS.rejected.match(result) || sendSMSToAllTenants.rejected.match(result))) {
        alert(result.payload || 'Failed to send SMS');
        return;
      }

      alert('SMS sent successfully!');
      setMessage('');
      setSelectedTenant('');
      setSelectedTenants([]);
      setPhoneNumber('');
      setSelectedProperties([]);
      
      // Refresh history
      await dispatch(fetchSMSHistory());
    } catch (err) {
      console.error('Send SMS error:', err);
      alert('An error occurred while sending SMS. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const { isOpen, toggle } = useMobileMenu();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isOpen} onClose={toggle} />
      <div className="flex-1 lg:ml-64 w-full">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Communication
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowPermissions(!showPermissions);
                  if (!showPermissions) fetchTenantPermissions();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                {showPermissions ? 'Hide' : 'Manage'} Permissions
              </button>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                {showConfig ? 'Hide' : 'SMS'} Settings
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-4 sm:py-8">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('send')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'send'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Send SMS
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                SMS History
              </button>
            </div>
          </div>

          {/* SMS Configuration */}
          {showConfig && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">SMS Configuration</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Africa's Talking API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="africasTalkingApiKey"
                      value={configForm.africasTalkingApiKey}
                      onChange={handleConfigChange}
                      placeholder="Enter API key"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Africa's Talking Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="africasTalkingUsername"
                      value={configForm.africasTalkingUsername}
                      onChange={handleConfigChange}
                      placeholder="Enter username"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender ID
                  </label>
                  <input
                    type="text"
                    name="africasTalkingSenderId"
                    value={configForm.africasTalkingSenderId}
                    onChange={handleConfigChange}
                    placeholder="TURBINE"
                    maxLength={11}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 11 characters. Leave empty to use default.</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Automatic Reminders</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="autoRemindersEnabled"
                        checked={configForm.autoRemindersEnabled}
                        onChange={handleConfigChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-700">Enable Automatic Reminders</span>
                    </label>

                    <div className="pl-8 space-y-4">
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            name="rentDueReminderEnabled"
                            checked={configForm.rentDueReminderEnabled}
                            onChange={handleConfigChange}
                            disabled={!configForm.autoRemindersEnabled}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="font-medium text-gray-700">Rent Due Reminders</span>
                        </label>
                        {configForm.rentDueReminderEnabled && (
                          <div className="pl-8">
                            <label className="block text-sm text-gray-600 mb-1">Days before due date</label>
                            <input
                              type="number"
                              name="rentDueReminderDays"
                              value={configForm.rentDueReminderDays}
                              onChange={handleConfigChange}
                              min="1"
                              max="30"
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            name="invoiceOverdueReminderEnabled"
                            checked={configForm.invoiceOverdueReminderEnabled}
                            onChange={handleConfigChange}
                            disabled={!configForm.autoRemindersEnabled}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="font-medium text-gray-700">Invoice Overdue Reminders</span>
                        </label>
                        {configForm.invoiceOverdueReminderEnabled && (
                          <div className="pl-8">
                            <label className="block text-sm text-gray-600 mb-1">Days after due date</label>
                            <input
                              type="number"
                              name="invoiceOverdueReminderDays"
                              value={configForm.invoiceOverdueReminderDays}
                              onChange={handleConfigChange}
                              min="1"
                              max="90"
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            name="leaseExpiryReminderEnabled"
                            checked={configForm.leaseExpiryReminderEnabled}
                            onChange={handleConfigChange}
                            disabled={!configForm.autoRemindersEnabled}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="font-medium text-gray-700">Lease Expiry Reminders</span>
                        </label>
                        {configForm.leaseExpiryReminderEnabled && (
                          <div className="pl-8">
                            <label className="block text-sm text-gray-600 mb-1">Days before expiry</label>
                            <input
                              type="number"
                              name="leaseExpiryReminderDays"
                              value={configForm.leaseExpiryReminderDays}
                              onChange={handleConfigChange}
                              min="1"
                              max="365"
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="paymentConfirmationEnabled"
                            checked={configForm.paymentConfirmationEnabled}
                            onChange={handleConfigChange}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-700">Payment Confirmation SMS</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Automatic Rent Reminders Based on Lease Start Date */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Automatic Rent Payment Reminders</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Automatically send SMS reminders based on lease start date. Reminders are sent 2 days before the end of each 30-day period, and 2 SMS daily when overdue.
                    </p>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="automaticRentRemindersEnabled"
                          checked={configForm.automaticRentRemindersEnabled}
                          onChange={handleConfigChange}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-700">Enable Automatic Rent Payment Reminders</span>
                      </label>

                      {configForm.automaticRentRemindersEnabled && (
                        <div className="pl-8 space-y-4 bg-blue-50 p-4 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Days Before 30-Day Period Ends (Reminder)
                            </label>
                            <input
                              type="number"
                              name="rentReminderDaysBefore"
                              value={configForm.rentReminderDaysBefore}
                              onChange={handleConfigChange}
                              min="0"
                              max="7"
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Default: 2 days before</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Days After Period Ends (Overdue Threshold)
                            </label>
                            <input
                              type="number"
                              name="rentReminderDaysAfter"
                              value={configForm.rentReminderDaysAfter}
                              onChange={handleConfigChange}
                              min="1"
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Default: 30 days (after this, daily reminders start)</p>
                          </div>

                          <div>
                            <label className="flex items-center gap-3 cursor-pointer mb-2">
                              <input
                                type="checkbox"
                                name="overdueDailySMSEnabled"
                                checked={configForm.overdueDailySMSEnabled}
                                onChange={handleConfigChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="font-medium text-gray-700">Send Daily SMS When Overdue</span>
                            </label>
                            {configForm.overdueDailySMSEnabled && (
                              <div className="pl-8 mt-2">
                                <label className="block text-sm text-gray-600 mb-1">SMS per day when overdue</label>
                                <input
                                  type="number"
                                  name="overdueSMSFrequency"
                                  value={configForm.overdueSMSFrequency}
                                  onChange={handleConfigChange}
                                  min="1"
                                  max="5"
                                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Default: 2 SMS per day</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowConfig(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Send SMS Tab */}
          {activeTab === 'send' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Send SMS</h2>
              
              {/* SMS Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Send To</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="smsType"
                      value="single"
                      checked={smsType === 'single'}
                      onChange={(e) => setSmsType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Single Tenant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="smsType"
                      value="bulk"
                      checked={smsType === 'bulk'}
                      onChange={(e) => setSmsType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Bulk (Selected Tenants)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="smsType"
                      value="all"
                      checked={smsType === 'all'}
                      onChange={(e) => setSmsType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>All Tenants</span>
                  </label>
                </div>
              </div>

              {/* Single Tenant */}
              {smsType === 'single' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Tenant (or enter phone number)</label>
                    <select
                      value={selectedTenant}
                      onChange={(e) => setSelectedTenant(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                    >
                      <option value="">Select a tenant...</option>
                      {tenants.filter(t => t.phoneNumber).map((tenant) => (
                        <option key={tenant._id} value={tenant._id}>
                          {tenant.firstName} {tenant.lastName} - {tenant.phoneNumber}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Or enter phone number (e.g., +254712345678)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Bulk Tenants */}
              {smsType === 'bulk' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Tenants</label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {tenants.filter(t => t.phoneNumber).length === 0 ? (
                      <p className="text-sm text-gray-500">No tenants with phone numbers found</p>
                    ) : (
                      <div className="space-y-2">
                        {tenants.filter(t => t.phoneNumber).map((tenant) => (
                          <label key={tenant._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTenants.includes(tenant._id)}
                              onChange={() => handleTenantToggle(tenant._id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{tenant.firstName} {tenant.lastName}</p>
                              <p className="text-sm text-gray-600">{tenant.phoneNumber}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Tenants */}
              {smsType === 'all' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Property (Optional)</label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProperties.length === 0}
                        onChange={() => setSelectedProperties([])}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-800">All Properties</span>
                    </label>
                    {properties.map((property) => (
                      <label key={property._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProperties.includes(property._id)}
                          onChange={() => {
                            if (selectedProperties.includes(property._id)) {
                              setSelectedProperties(prev => prev.filter(id => id !== property._id));
                            } else {
                              setSelectedProperties(prev => [...prev, property._id]);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-800">{property.propertyName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                  <span className="text-gray-500 ml-2">({message.length} characters)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="6"
                  placeholder="Enter your message here..."
                  maxLength={160}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 160 characters. Longer messages will be split into multiple SMS.</p>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendSMS}
                disabled={loading || !message.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : `Send SMS ${smsType === 'single' ? 'to Tenant' : smsType === 'bulk' ? `to ${selectedTenants.length} Tenants` : 'to All Tenants'}`}
              </button>

              {error && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Tenant SMS Permissions Management */}
          {showPermissions && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Tenant SMS Permissions</h2>
              <p className="text-sm text-gray-600 mb-4">
                Disable SMS reminders for tenants who have requested permission. SMS will be automatically re-enabled after the specified date.
              </p>

              {tenantPermissions.length === 0 ? (
                <p className="text-gray-600">No tenants found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property/Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease Start</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SMS Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disabled Until</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenantPermissions.map((tenant) => (
                        <tr key={tenant._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="font-medium text-gray-900">{tenant.firstName} {tenant.lastName}</div>
                            <div className="text-gray-500">{tenant.phoneNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tenant.propertyId?.propertyName} / {tenant.unitId?.unitId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tenant.leaseStartDate ? new Date(tenant.leaseStartDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              tenant.smsRemindersDisabled 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {tenant.smsRemindersDisabled ? 'Disabled' : 'Enabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tenant.smsDisabledUntil ? new Date(tenant.smsDisabledUntil).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedTenantForPermission(tenant);
                                setPermissionForm({
                                  disabled: tenant.smsRemindersDisabled,
                                  disabledUntil: tenant.smsDisabledUntil ? new Date(tenant.smsDisabledUntil).toISOString().split('T')[0] : '',
                                  reason: tenant.smsDisableReason || ''
                                });
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              {tenant.smsRemindersDisabled ? 'Edit' : 'Disable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Permission Modal */}
              {selectedTenantForPermission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      {selectedTenantForPermission.smsRemindersDisabled ? 'Edit' : 'Disable'} SMS for {selectedTenantForPermission.firstName} {selectedTenantForPermission.lastName}
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissionForm.disabled}
                          onChange={(e) => setPermissionForm({ ...permissionForm, disabled: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-700">Disable SMS Reminders</span>
                      </label>

                      {permissionForm.disabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Disable Until Date
                            </label>
                            <input
                              type="date"
                              value={permissionForm.disabledUntil}
                              onChange={(e) => setPermissionForm({ ...permissionForm, disabledUntil: e.target.value })}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">SMS will be automatically re-enabled after this date</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reason (Optional)
                            </label>
                            <textarea
                              value={permissionForm.reason}
                              onChange={(e) => setPermissionForm({ ...permissionForm, reason: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              rows="3"
                              placeholder="e.g., Tenant requested to disable until payment is made"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={() => {
                            setSelectedTenantForPermission(null);
                            setPermissionForm({ disabled: false, disabledUntil: '', reason: '' });
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              await axios.put(
                                `${API_URL}/tenant-sms-permissions/${selectedTenantForPermission._id}/disable`,
                                {
                                  disabled: permissionForm.disabled,
                                  disabledUntil: permissionForm.disabledUntil,
                                  reason: permissionForm.reason
                                },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              alert('SMS permission updated successfully!');
                              setSelectedTenantForPermission(null);
                              setPermissionForm({ disabled: false, disabledUntil: '', reason: '' });
                              fetchTenantPermissions();
                            } catch (error) {
                              console.error('Error updating permission:', error);
                              alert(error.response?.data?.message || 'Failed to update permission');
                            }
                          }}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SMS History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">SMS History</h2>
              
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No SMS history available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Recipients</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Message</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((sms) => (
                        <tr key={sms._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(sms.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                            {sms.recipientType?.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {sms.recipients?.length || 0} recipient{sms.recipients?.length !== 1 ? 's' : ''}
                            {sms.successCount > 0 && <span className="text-green-600 ml-1">({sms.successCount} sent)</span>}
                            {sms.failureCount > 0 && <span className="text-red-600 ml-1">({sms.failureCount} failed)</span>}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800 max-w-md truncate">
                            {sms.message}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(sms.status)}`}>
                              {sms.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CommunicationPage;
