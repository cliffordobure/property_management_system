import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProperty } from '../store/slices/propertySlice';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AddPropertyPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.properties);
  const { token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    propertyName: '',
    numberOfUnits: '',
    country: 'Kenya',
    city: '',
    location: '',
    waterRate: '',
    electricityRate: '',
    mpesaPaybill: '',
    mpesaTill: '',
    rentPaymentPenalty: '',
    taxRate: '',
    garbageBill: '',
    managementFee: '',
    streetName: '',
    companyName: '',
    notes: '',
    paymentInstructions: '',
    otherRecurringBills: []
  });

  const [newBill, setNewBill] = useState({ name: '', amount: '' });
  const [calculatedPricing, setCalculatedPricing] = useState(null);
  const [pricingError, setPricingError] = useState(null);
  const [calculatingPricing, setCalculatingPricing] = useState(false);
  const [agreedToPricing, setAgreedToPricing] = useState(false);

  // Calculate pricing when numberOfUnits changes
  useEffect(() => {
    const doCalculatePricing = async () => {
      if (formData.numberOfUnits && parseInt(formData.numberOfUnits) > 0) {
        setCalculatingPricing(true);
        setPricingError(null);
        try {
          const response = await axios.post(
            `${API_URL}/properties/calculate-pricing`,
            { numberOfUnits: parseInt(formData.numberOfUnits) },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setCalculatedPricing(response.data.calculatedPricing);
          setAgreedToPricing(false); // Reset agreement when pricing changes
        } catch (error) {
          console.error('Error calculating pricing:', error);
          setCalculatedPricing(null);
          const message = error.response?.data?.message || 'Unable to calculate pricing. Please ensure the number of units is valid.';
          setPricingError(message);
        } finally {
          setCalculatingPricing(false);
        }
      } else {
        setCalculatedPricing(null);
        setPricingError(null);
        setAgreedToPricing(false);
      }
    };

    const timeoutId = setTimeout(doCalculatePricing, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.numberOfUnits, token]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agreedToPricing) {
      alert('Please agree to the pricing plan before creating the property.');
      return;
    }
    
    const submitData = {
      ...formData,
      numberOfUnits: parseInt(formData.numberOfUnits),
      country: formData.country || 'Kenya',
      location: formData.location || null,
      waterRate: formData.waterRate ? parseFloat(formData.waterRate) : null,
      electricityRate: formData.electricityRate ? parseFloat(formData.electricityRate) : null,
      rentPaymentPenalty: formData.rentPaymentPenalty ? parseFloat(formData.rentPaymentPenalty) : null,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : null,
      garbageBill: formData.garbageBill ? parseFloat(formData.garbageBill) : null,
      managementFee: formData.managementFee ? parseFloat(formData.managementFee) : null,
      mpesaPaybill: formData.mpesaPaybill || null,
      mpesaTill: formData.mpesaTill || null,
      streetName: formData.streetName || null,
      companyName: formData.companyName || null,
      notes: formData.notes || null,
      paymentInstructions: formData.paymentInstructions || null,
      agreedToPricing: true
    };

    const result = await dispatch(createProperty(submitData));
    if (!result.error) {
      alert('Property created successfully! It will be reviewed by an admin before tenants can access it.');
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
              <h1 className="text-xl font-semibold text-gray-800">Add Property</h1>
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
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="propertyName"
                  value={formData.propertyName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Units <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfUnits"
                  value={formData.numberOfUnits}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g., Kenya"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location/Area
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Westlands, Kilimani, etc."
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
                  Water Rate (KES)
                </label>
                <input
                  type="number"
                  name="waterRate"
                  value={formData.waterRate}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Electricity Rate (KES)
                </label>
                <input
                  type="number"
                  name="electricityRate"
                  value={formData.electricityRate}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MPESA Paybill
                </label>
                <input
                  type="text"
                  name="mpesaPaybill"
                  value={formData.mpesaPaybill}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MPESA Till
                </label>
                <input
                  type="text"
                  name="mpesaTill"
                  value={formData.mpesaTill}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garbage Bill (KES)
                </label>
                <input
                  type="number"
                  name="garbageBill"
                  value={formData.garbageBill}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Management Fee (KES)
                </label>
                <input
                  type="number"
                  name="managementFee"
                  value={formData.managementFee}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Name
                </label>
                <input
                  type="text"
                  name="streetName"
                  value={formData.streetName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Instructions
                </label>
                <textarea
                  name="paymentInstructions"
                  value={formData.paymentInstructions}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Other Recurring Bills */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Other Recurring Bills</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
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
            {formData.otherRecurringBills.length > 0 && (
              <div className="space-y-2">
                {formData.otherRecurringBills.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span>{bill.name} - KES {bill.amount}</span>
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
          </div>

          {/* Pricing Information */}
          {formData.numberOfUnits && parseInt(formData.numberOfUnits) > 0 && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Subscription Pricing</h2>
              {calculatingPricing ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Calculating pricing...</p>
                </div>
              ) : calculatedPricing ? (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {calculatedPricing.planName?.toUpperCase() || 'PLAN'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        For {formData.numberOfUnits} unit{parseInt(formData.numberOfUnits) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">
                        {calculatedPricing.planPrice?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {calculatedPricing.currency || 'KES'} / {calculatedPricing.billingPeriod || 'month'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> This property will require admin verification before tenants can access it. 
                      You will be notified once it's verified.
                    </p>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToPricing}
                      onChange={(e) => setAgreedToPricing(e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the pricing plan of <strong>{calculatedPricing.planPrice?.toLocaleString()} {calculatedPricing.currency || 'KES'}</strong> per {calculatedPricing.billingPeriod || 'month'} for managing {formData.numberOfUnits} unit{parseInt(formData.numberOfUnits) !== 1 ? 's' : ''}. 
                      I understand that this property must be verified by an admin before tenants can access it.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    {pricingError || 'Unable to calculate pricing. Please ensure the number of units is valid.'}
                  </p>
                </div>
              )}
            </div>
          )}

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
              disabled={!agreedToPricing || calculatingPricing || loading || !calculatedPricing}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
        </main>
      </div>
    </div>
  );
};

export default AddPropertyPage;
