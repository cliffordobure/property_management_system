import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createTenant } from '../store/slices/tenantSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import { fetchUnits } from '../store/slices/unitSlice';
import Sidebar from '../components/Sidebar';

const AddTenantPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.tenants);
  const { properties } = useSelector((state) => state.properties);
  const { units } = useSelector((state) => state.units);

  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    deposit: {
      type: 'security',
      amount: '',
      paid: '',
      amountReturned: ''
    },
    accountNumber: '',
    nationalId: '',
    email: '',
    kraTaxPin: '',
    rentPaymentPenalty: '',
    notes: '',
    moveInDate: '',
    otherPhoneNumbers: [],
    leaseStartDate: '',
    leaseExpiryDate: '',
    files: []
  });

  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  useEffect(() => {
    if (formData.propertyId) {
      dispatch(fetchUnits(formData.propertyId));
    }
  }, [formData.propertyId, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('deposit.')) {
      const depositField = name.split('.')[1];
      setFormData({
        ...formData,
        deposit: {
          ...formData.deposit,
          [depositField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      files: Array.from(e.target.files)
    });
  };

  const handleAddPhone = () => {
    if (newPhone.trim()) {
      setFormData({
        ...formData,
        otherPhoneNumbers: [...formData.otherPhoneNumbers, newPhone.trim()]
      });
      setNewPhone('');
    }
  };

  const handleRemovePhone = (index) => {
    setFormData({
      ...formData,
      otherPhoneNumbers: formData.otherPhoneNumbers.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      deposit: formData.deposit.amount ? {
        type: formData.deposit.type,
        amount: parseFloat(formData.deposit.amount),
        paid: parseFloat(formData.deposit.paid) || 0,
        amountReturned: parseFloat(formData.deposit.amountReturned) || 0
      } : null,
      rentPaymentPenalty: formData.rentPaymentPenalty ? parseFloat(formData.rentPaymentPenalty) : null,
      moveInDate: formData.moveInDate || null,
      leaseStartDate: formData.leaseStartDate || null,
      leaseExpiryDate: formData.leaseExpiryDate || null,
      accountNumber: formData.accountNumber || null,
      nationalId: formData.nationalId || null,
      email: formData.email || null,
      kraTaxPin: formData.kraTaxPin || null,
      notes: formData.notes || null
    };

    const result = await dispatch(createTenant(submitData));
    if (!result.error) {
      navigate('/dashboard');
    }
  };

  const availableUnits = units.filter(unit => !unit.isOccupied);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Add Tenant</h1>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 max-w-4xl">

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Required Fields */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Required Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Property <span className="text-red-500">*</span>
                </label>
                <select
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.propertyName} - {property.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unitId"
                  value={formData.unitId}
                  onChange={handleChange}
                  required
                  disabled={!formData.propertyId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select a unit</option>
                  {availableUnits.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.unitId} - KES {unit.rentAmount}
                    </option>
                  ))}
                </select>
                {formData.propertyId && availableUnits.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">No available units in this property</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Deposit Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Deposit Information (Optional)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Type
                </label>
                <select
                  name="deposit.type"
                  value={formData.deposit.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="security">Security</option>
                  <option value="rent">Rent</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Amount (KES)
                </label>
                <input
                  type="number"
                  name="deposit.amount"
                  value={formData.deposit.amount}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Paid (KES)
                </label>
                <input
                  type="number"
                  name="deposit.paid"
                  value={formData.deposit.paid}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Returned (KES)
                </label>
                <input
                  type="number"
                  name="deposit.amountReturned"
                  value={formData.deposit.amountReturned}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Optional Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National ID
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                  <span className="text-xs text-gray-500 ml-2 font-normal">(Optional - auto-links if tenant user exists)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tenant@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If a tenant has already registered with this email, their account will be automatically linked to this tenant record.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KRA/Tax PIN
                </label>
                <input
                  type="text"
                  name="kraTaxPin"
                  value={formData.kraTaxPin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rent Payment Penalty (KES)
                </label>
                <input
                  type="number"
                  name="rentPaymentPenalty"
                  value={formData.rentPaymentPenalty}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move In Date
                </label>
                <input
                  type="date"
                  name="moveInDate"
                  value={formData.moveInDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Start Date
                </label>
                <input
                  type="date"
                  name="leaseStartDate"
                  value={formData.leaseStartDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Expiry Date
                </label>
                <input
                  type="date"
                  name="leaseExpiryDate"
                  value={formData.leaseExpiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Other Phone Numbers */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Other Phone Numbers</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="tel"
                placeholder="Phone number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddPhone}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
            {formData.otherPhoneNumbers.length > 0 && (
              <div className="space-y-2">
                {formData.otherPhoneNumbers.map((phone, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span>{phone}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">File Upload</h2>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.files.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {formData.files.length} file(s) selected
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
        </main>
      </div>
    </div>
  );
};

export default AddTenantPage;
