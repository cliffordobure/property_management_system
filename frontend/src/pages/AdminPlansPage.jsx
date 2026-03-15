import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPlansPage = () => {
  const dispatch = useDispatch();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    price: '',
    currency: 'KES',
    billingPeriod: 'monthly',
    features: {
      maxProperties: '',
      maxUnits: '',
      maxTenants: '',
      maxUsers: '',
      smsIncluded: '',
      supportLevel: 'basic',
      advancedReports: false,
      apiAccess: false,
      customBranding: false
    },
    isActive: true,
    isDefault: false
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/subscription-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err.response?.data?.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('features.')) {
      const featureName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureName]: type === 'checkbox' ? checked : (value === '' ? null : (isNaN(value) ? value : parseInt(value)))
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (name === 'price' ? parseFloat(value) || 0 : value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.displayName || formData.price === undefined) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        features: {
          ...formData.features,
          maxProperties: formData.features.maxProperties === '' || formData.features.maxProperties === null ? null : parseInt(formData.features.maxProperties),
          maxUnits: formData.features.maxUnits === '' || formData.features.maxUnits === null ? null : parseInt(formData.features.maxUnits),
          maxTenants: formData.features.maxTenants === '' || formData.features.maxTenants === null ? null : parseInt(formData.features.maxTenants),
          maxUsers: formData.features.maxUsers === '' || formData.features.maxUsers === null ? null : parseInt(formData.features.maxUsers),
          smsIncluded: formData.features.smsIncluded === '' || formData.features.smsIncluded === null ? 0 : parseInt(formData.features.smsIncluded)
        }
      };

      if (editingPlan) {
        await axios.put(`${API_URL}/admin/subscription-plans/${editingPlan._id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Plan updated successfully!');
      } else {
        await axios.post(`${API_URL}/admin/subscription-plans`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Plan created successfully!');
      }

      setShowForm(false);
      setEditingPlan(null);
      resetForm();
      // Wait a bit before fetching to ensure backend has processed
      setTimeout(() => {
        fetchPlans();
      }, 500);
    } catch (err) {
      console.error('Error saving plan:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save plan';
      alert(errorMessage);
      // If it's a duplicate name error, suggest editing existing plan
      if (errorMessage.toLowerCase().includes('already exists') || err.response?.status === 400) {
        const existingPlan = plans.find(p => p.name === formData.name);
        if (existingPlan) {
          if (window.confirm(`A ${formData.name} plan already exists. Would you like to edit it instead?`)) {
            handleEdit(existingPlan);
          }
        }
      }
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency || 'KES',
      billingPeriod: plan.billingPeriod || 'monthly',
      features: {
        maxProperties: plan.features?.maxProperties || '',
        maxUnits: plan.features?.maxUnits || '',
        maxTenants: plan.features?.maxTenants || '',
        maxUsers: plan.features?.maxUsers || '',
        smsIncluded: plan.features?.smsIncluded || '',
        supportLevel: plan.features?.supportLevel || 'basic',
        advancedReports: plan.features?.advancedReports || false,
        apiAccess: plan.features?.apiAccess || false,
        customBranding: plan.features?.customBranding || false
      },
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      isDefault: plan.isDefault || false
    });
    setShowForm(true);
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/subscription-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Plan deleted successfully!');
      fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      price: '',
      currency: 'KES',
      billingPeriod: 'monthly',
      features: {
        maxProperties: '',
        maxUnits: '',
        maxTenants: '',
        maxUsers: '',
        smsIncluded: '',
        supportLevel: 'basic',
        advancedReports: false,
        apiAccess: false,
        customBranding: false
      },
      isActive: true,
      isDefault: false
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Subscription Plans
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  if (showForm) {
                    setEditingPlan(null);
                    resetForm();
                  }
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                {showForm ? 'Cancel' : '+ Create Plan'}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Create/Edit Plan Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name (ID) <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={!!editingPlan}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select plan name</option>
                      {!plans.find(p => p.name === 'free') && <option value="free">Free</option>}
                      {!plans.find(p => p.name === 'basic') && <option value="basic">Basic</option>}
                      {!plans.find(p => p.name === 'premium') && <option value="premium">Premium</option>}
                      {!plans.find(p => p.name === 'enterprise') && <option value="enterprise">Enterprise</option>}
                    </select>
                    {plans.find(p => p.name === formData.name && (!editingPlan || p._id !== editingPlan._id)) && (
                      <p className="text-sm text-red-600 mt-1">This plan name already exists. Please select a different name or edit the existing plan.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Free Plan"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Plan description..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="KES">KES</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Period
                    </label>
                    <select
                      name="billingPeriod"
                      value={formData.billingPeriod}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Features & Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Properties (leave empty for unlimited)
                      </label>
                      <input
                        type="number"
                        name="features.maxProperties"
                        value={formData.features.maxProperties}
                        onChange={handleChange}
                        min="0"
                        placeholder="Unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Units
                      </label>
                      <input
                        type="number"
                        name="features.maxUnits"
                        value={formData.features.maxUnits}
                        onChange={handleChange}
                        min="0"
                        placeholder="Unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Tenants
                      </label>
                      <input
                        type="number"
                        name="features.maxTenants"
                        value={formData.features.maxTenants}
                        onChange={handleChange}
                        min="0"
                        placeholder="Unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Users
                      </label>
                      <input
                        type="number"
                        name="features.maxUsers"
                        value={formData.features.maxUsers}
                        onChange={handleChange}
                        min="0"
                        placeholder="Unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMS Included (per month)
                      </label>
                      <input
                        type="number"
                        name="features.smsIncluded"
                        value={formData.features.smsIncluded}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Support Level
                      </label>
                      <select
                        name="features.supportLevel"
                        value={formData.features.supportLevel}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="basic">Basic</option>
                        <option value="priority">Priority</option>
                        <option value="dedicated">Dedicated</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="features.advancedReports"
                        checked={formData.features.advancedReports}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Advanced Reports</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="features.apiAccess"
                        checked={formData.features.apiAccess}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">API Access</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="features.customBranding"
                        checked={formData.features.customBranding}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Custom Branding</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Default Plan</span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPlan(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Plans List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Subscription Plans ({plans.length})</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading plans...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Plans</h3>
                <p className="text-gray-500 mb-4">Create your first subscription plan to get started.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  Create Plan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan._id}
                    className={`border-2 rounded-lg p-6 hover:shadow-lg transition ${
                      plan.isDefault ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{plan.displayName}</h3>
                        {plan.isDefault && (
                          <span className="inline-block mt-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatCurrency(plan.price)}
                        </p>
                        <p className="text-sm text-gray-500">/{plan.billingPeriod}</p>
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {plan.features?.maxProperties !== null && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Properties:</span> {plan.features.maxProperties || 'Unlimited'}
                        </p>
                      )}
                      {plan.features?.maxUnits !== null && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Units:</span> {plan.features.maxUnits || 'Unlimited'}
                        </p>
                      )}
                      {plan.features?.maxTenants !== null && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Tenants:</span> {plan.features.maxTenants || 'Unlimited'}
                        </p>
                      )}
                      {plan.features?.smsIncluded > 0 && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">SMS:</span> {plan.features.smsIncluded}/month
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                      >
                        Edit
                      </button>
                      {!plan.isDefault && (
                        <button
                          onClick={() => handleDelete(plan._id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPlansPage;
