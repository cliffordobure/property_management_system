import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpenses, createExpense, fetchExpenseStats } from '../store/slices/expenseSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import { fetchUnits } from '../store/slices/unitSlice';
import Sidebar from '../components/Sidebar';

const ExpensesPage = () => {
  const dispatch = useDispatch();
  const { expenses, stats, loading, error } = useSelector((state) => state.expenses);
  const { properties } = useSelector((state) => state.properties);
  const { units } = useSelector((state) => state.units);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'other',
    description: '',
    amount: '',
    paymentMethod: 'cash',
    vendor: '',
    referenceNumber: '',
    receiptNumber: '',
    notes: ''
  });

  const [propertyUnits, setPropertyUnits] = useState([]);

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchProperties());
    dispatch(fetchExpenseStats());
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
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset unit when property changes
    if (name === 'propertyId') {
      setFormData(prev => ({
        ...prev,
        propertyId: value,
        unitId: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate || new Date().toISOString().split('T')[0],
        propertyId: formData.propertyId || null,
        unitId: formData.unitId || null,
        vendor: formData.vendor || null,
        referenceNumber: formData.referenceNumber || null,
        receiptNumber: formData.receiptNumber || null,
        notes: formData.notes || null
      };

      const result = await dispatch(createExpense(submitData));
      if (createExpense.rejected.match(result)) {
        alert(result.payload || 'Failed to create expense');
        return;
      }

      alert('Expense recorded successfully!');
      setShowCreateForm(false);
      setFormData({
        propertyId: '',
        unitId: '',
        expenseDate: new Date().toISOString().split('T')[0],
        category: 'other',
        description: '',
        amount: '',
        paymentMethod: 'cash',
        vendor: '',
        referenceNumber: '',
        receiptNumber: '',
        notes: ''
      });
      
      // Refresh data
      await dispatch(fetchExpenses());
      await dispatch(fetchExpenseStats());
    } catch (err) {
      console.error('Expense creation error:', err);
      alert('An error occurred while recording the expense. Please try again.');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      maintenance: 'Maintenance',
      repairs: 'Repairs',
      utilities: 'Utilities',
      supplies: 'Supplies',
      insurance: 'Insurance',
      taxes: 'Taxes',
      legal: 'Legal',
      marketing: 'Marketing',
      cleaning: 'Cleaning',
      security: 'Security',
      management: 'Management',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      mpesa: 'M-Pesa',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      cheque: 'Cheque',
      credit_card: 'Credit Card',
      other: 'Other'
    };
    return labels[method] || method;
  };

  const topCategories = stats?.byCategory ? Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expenses
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showCreateForm ? 'Cancel' : '+ Add Expense'}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-800">KES {stats.totalAmount?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.count || 0} expense(s)</p>
              </div>
              {topCategories.slice(0, 3).map(([category, amount]) => (
                <div key={category} className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-sm text-gray-600 mb-2">{getCategoryLabel(category)}</p>
                  <p className="text-2xl font-bold text-blue-600">KES {amount?.toLocaleString() || 0}</p>
                </div>
              ))}
            </div>
          )}

          {/* Create Expense Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property (Optional)</label>
                    <select
                      name="propertyId"
                      value={formData.propertyId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Properties</option>
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
                      Expense Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expenseDate"
                      value={formData.expenseDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="maintenance">Maintenance</option>
                      <option value="repairs">Repairs</option>
                      <option value="utilities">Utilities</option>
                      <option value="supplies">Supplies</option>
                      <option value="insurance">Insurance</option>
                      <option value="taxes">Taxes</option>
                      <option value="legal">Legal</option>
                      <option value="marketing">Marketing</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="security">Security</option>
                      <option value="management">Management</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="3"
                    placeholder="Describe the expense..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor/Supplier</label>
                    <input
                      type="text"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleChange}
                      placeholder="Vendor name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                    <input
                      type="text"
                      name="referenceNumber"
                      value={formData.referenceNumber}
                      onChange={handleChange}
                      placeholder="Transaction/Reference number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Number</label>
                  <input
                    type="text"
                    name="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={handleChange}
                    placeholder="Receipt number (optional)"
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
                    {loading ? 'Recording...' : 'Record Expense'}
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

          {/* Expenses List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">All Expenses ({expenses.length})</h2>

            {loading ? (
              <p className="text-gray-600">Loading expenses...</p>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Expenses</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by recording your first expense.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Property/Unit</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-sm text-gray-600">{expense.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {getCategoryLabel(expense.category)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {typeof expense.propertyId === 'object' && expense.propertyId 
                            ? expense.propertyId.propertyName 
                            : 'N/A'}
                          {typeof expense.unitId === 'object' && expense.unitId 
                            ? ` / ${expense.unitId.unitId}` 
                            : ''}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {expense.vendor || '-'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-red-600">
                          KES {expense.amount?.toLocaleString() || 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {getPaymentMethodLabel(expense.paymentMethod)}
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

export default ExpensesPage;
