import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createUnit } from '../store/slices/unitSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import Sidebar from '../components/Sidebar';

const AddUnitPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.units);
  const { properties } = useSelector((state) => state.properties);

  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    rentAmount: '',
    taxRate: '',
    notes: '',
    otherRecurringBills: []
  });

  const [newBill, setNewBill] = useState({ name: '', amount: '' });
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  useEffect(() => {
    if (formData.propertyId) {
      const property = properties.find(p => p._id === formData.propertyId);
      setSelectedProperty(property);
      // Inherit recurring bills from property
      if (property && property.otherRecurringBills && property.otherRecurringBills.length > 0) {
        setFormData(prev => ({
          ...prev,
          otherRecurringBills: property.otherRecurringBills.map(bill => ({
            name: bill.name,
            amount: bill.amount
          }))
        }));
      }
    }
  }, [formData.propertyId, properties]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddRecurringBill = () => {
    if (newBill.name && newBill.amount) {
      setFormData({
        ...formData,
        otherRecurringBills: [
          ...formData.otherRecurringBills,
          { name: newBill.name, amount: parseFloat(newBill.amount) }
        ]
      });
      setNewBill({ name: '', amount: '' });
    }
  };

  const handleRemoveRecurringBill = (index) => {
    setFormData({
      ...formData,
      otherRecurringBills: formData.otherRecurringBills.filter((_, i) => i !== index)
    });
  };

  const handleUpdateBillAmount = (index, amount) => {
    const updatedBills = [...formData.otherRecurringBills];
    updatedBills[index].amount = parseFloat(amount);
    setFormData({
      ...formData,
      otherRecurringBills: updatedBills
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      rentAmount: parseFloat(formData.rentAmount),
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : null,
      notes: formData.notes || null
    };

    const result = await dispatch(createUnit(submitData));
    if (!result.error) {
      navigate('/dashboard');
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-800">Add Unit</h1>
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
                  Unit ID/Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="unitId"
                  value={formData.unitId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rent Amount (KES) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="rentAmount"
                  value={formData.rentAmount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
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
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  step="0.01"
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

          {/* Other Recurring Bills */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Other Recurring Bills
              {selectedProperty && (
                <span className="text-sm text-gray-600 font-normal ml-2">
                  (Inherited from property, editable)
                </span>
              )}
            </h2>
            
            {formData.otherRecurringBills.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.otherRecurringBills.map((bill, index) => (
                  <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{bill.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={bill.amount}
                        onChange={(e) => handleUpdateBillAmount(index, e.target.value)}
                        step="0.01"
                        className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-600">KES</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecurringBill(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Bill Name"
                  value={newBill.name}
                  onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Amount (KES)"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddRecurringBill}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Bill
                </button>
              </div>
            </div>
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
              {loading ? 'Creating...' : 'Create Unit'}
            </button>
          </div>
        </form>
        </main>
      </div>
    </div>
  );
};

export default AddUnitPage;
