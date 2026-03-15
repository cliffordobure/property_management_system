import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUtilities, createUtility, markUtilityPaid, fetchUtilityStats } from '../store/slices/utilitySlice';
import { fetchProperties } from '../store/slices/propertySlice';
import { fetchUnits } from '../store/slices/unitSlice';
import Sidebar from '../components/Sidebar';

const UtilitiesPage = () => {
  const dispatch = useDispatch();
  const { utilities, stats, loading, error } = useSelector((state) => state.utilities);
  const { properties } = useSelector((state) => state.properties);
  const { units } = useSelector((state) => state.units);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    utilityType: 'water',
    billingPeriod: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    },
    meterReading: {
      previous: '',
      current: '',
      unit: ''
    },
    rate: '',
    amount: '',
    dueDate: '',
    accountNumber: '',
    referenceNumber: '',
    notes: ''
  });

  const [propertyUnits, setPropertyUnits] = useState([]);

  useEffect(() => {
    dispatch(fetchUtilities());
    dispatch(fetchProperties());
    dispatch(fetchUtilityStats());
  }, [dispatch]);

  useEffect(() => {
    if (formData.propertyId) {
      dispatch(fetchUnits({ propertyId: formData.propertyId }));
    }
  }, [formData.propertyId, dispatch]);

  useEffect(() => {
    if (formData.propertyId && units) {
      const filteredUnits = units.filter(u => 
        u.propertyId === formData.propertyId || 
        (typeof u.propertyId === 'object' && u.propertyId._id === formData.propertyId)
      );
      setPropertyUnits(filteredUnits);
    } else {
      setPropertyUnits([]);
    }
  }, [formData.propertyId, units]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('billingPeriod.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        billingPeriod: {
          ...formData.billingPeriod,
          [field]: value
        }
      });
    } else if (name.startsWith('meterReading.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        meterReading: {
          ...formData.meterReading,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Reset unit when property changes
    if (name === 'propertyId') {
      setFormData(prev => ({
        ...prev,
        propertyId: value,
        unitId: ''
      }));
    }

    // Calculate amount if meter readings and rate are provided
    if (name === 'meterReading.current' || name === 'meterReading.previous' || name === 'rate') {
      const current = parseFloat(formData.meterReading.current) || 0;
      const previous = parseFloat(formData.meterReading.previous) || 0;
      const rate = parseFloat(name === 'rate' ? value : formData.rate) || 0;
      
      if (current > previous && rate > 0) {
        const usage = current - previous;
        const calculatedAmount = usage * rate;
        setFormData(prev => ({
          ...prev,
          amount: calculatedAmount.toFixed(2)
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.propertyId || !formData.utilityType || !formData.amount || !formData.billingPeriod.startDate || !formData.billingPeriod.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        propertyId: formData.propertyId,
        unitId: formData.unitId || null,
        utilityType: formData.utilityType,
        billingPeriod: {
          startDate: formData.billingPeriod.startDate,
          endDate: formData.billingPeriod.endDate
        },
        meterReading: (formData.meterReading.current || formData.meterReading.previous) ? {
          previous: formData.meterReading.previous ? parseFloat(formData.meterReading.previous) : null,
          current: formData.meterReading.current ? parseFloat(formData.meterReading.current) : null,
          unit: formData.meterReading.unit || null
        } : null,
        rate: formData.rate ? parseFloat(formData.rate) : null,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate || null,
        accountNumber: formData.accountNumber || null,
        referenceNumber: formData.referenceNumber || null,
        notes: formData.notes || null
      };

      const result = await dispatch(createUtility(submitData));
      if (createUtility.rejected.match(result)) {
        alert(result.payload || 'Failed to create utility');
        return;
      }

      alert('Utility bill recorded successfully!');
      setShowCreateForm(false);
      setFormData({
        propertyId: '',
        unitId: '',
        utilityType: 'water',
        billingPeriod: {
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
        },
        meterReading: {
          previous: '',
          current: '',
          unit: ''
        },
        rate: '',
        amount: '',
        dueDate: '',
        accountNumber: '',
        referenceNumber: '',
        notes: ''
      });
      
      // Refresh data
      await dispatch(fetchUtilities());
      await dispatch(fetchUtilityStats());
    } catch (err) {
      console.error('Utility creation error:', err);
      alert('An error occurred while recording the utility. Please try again.');
    }
  };

  const handleMarkPaid = async (utilityId) => {
    if (window.confirm('Mark this utility bill as paid?')) {
      try {
        await dispatch(markUtilityPaid(utilityId));
        await dispatch(fetchUtilities());
        await dispatch(fetchUtilityStats());
      } catch (err) {
        console.error('Mark paid error:', err);
      }
    }
  };

  const getUtilityTypeLabel = (type) => {
    const labels = {
      water: 'Water',
      electricity: 'Electricity',
      gas: 'Gas',
      internet: 'Internet',
      sewer: 'Sewer',
      trash: 'Trash',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Utilities
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showCreateForm ? 'Cancel' : '+ Add Utility'}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Total Bills</p>
                <p className="text-2xl font-bold text-gray-800">KES {stats.totalAmount?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.count || 0} bill(s)</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Paid</p>
                <p className="text-2xl font-bold text-green-600">KES {stats.paidAmount?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">KES {stats.pendingAmount?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Overdue</p>
                <p className="text-2xl font-bold text-red-600">KES {stats.overdueAmount?.toLocaleString() || 0}</p>
              </div>
            </div>
          )}

          {/* Create Utility Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Utility Bill</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property <span className="text-red-500">*</span>
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
                          {property.propertyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit (Optional)</label>
                    <select
                      name="unitId"
                      value={formData.unitId}
                      onChange={handleChange}
                      disabled={!formData.propertyId}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">All Units</option>
                      {propertyUnits.map((unit) => (
                        <option key={unit._id} value={unit._id}>
                          {unit.unitId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Utility Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="utilityType"
                      value={formData.utilityType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="water">Water</option>
                      <option value="electricity">Electricity</option>
                      <option value="gas">Gas</option>
                      <option value="internet">Internet</option>
                      <option value="sewer">Sewer</option>
                      <option value="trash">Trash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Period Start <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="billingPeriod.startDate"
                      value={formData.billingPeriod.startDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Period End <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="billingPeriod.endDate"
                      value={formData.billingPeriod.endDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Previous Reading</label>
                    <input
                      type="number"
                      name="meterReading.previous"
                      value={formData.meterReading.previous}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="Previous"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Reading</label>
                    <input
                      type="number"
                      name="meterReading.current"
                      value={formData.meterReading.current}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="Current"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <input
                      type="text"
                      name="meterReading.unit"
                      value={formData.meterReading.unit}
                      onChange={handleChange}
                      placeholder="kWh, m³, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rate per Unit</label>
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="Rate"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="Account number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    placeholder="Bill/Reference number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Additional notes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Recording...' : 'Record Utility Bill'}
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

          {/* Utilities List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">All Utility Bills ({utilities.length})</h2>

            {loading ? (
              <p className="text-gray-600">Loading utilities...</p>
            ) : utilities.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Utility Bills</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by recording your first utility bill.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Property/Unit</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Meter Reading</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilities.map((utility) => (
                      <tr key={utility._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {new Date(utility.billingPeriod?.startDate).toLocaleDateString()} - {new Date(utility.billingPeriod?.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {getUtilityTypeLabel(utility.utilityType)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {typeof utility.propertyId === 'object' && utility.propertyId 
                            ? utility.propertyId.propertyName 
                            : 'N/A'}
                          {typeof utility.unitId === 'object' && utility.unitId 
                            ? ` / ${utility.unitId.unitId}` 
                            : ''}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {utility.meterReading?.previous && utility.meterReading?.current 
                            ? `${utility.meterReading.previous} → ${utility.meterReading.current} ${utility.meterReading.unit || ''}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          KES {utility.amount?.toLocaleString() || 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {utility.dueDate 
                            ? new Date(utility.dueDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${getStatusColor(utility.status)}`}>
                            {utility.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {utility.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(utility._id)}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UtilitiesPage;
