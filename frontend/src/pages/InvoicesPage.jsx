import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchInvoices, fetchSingleInvoice, createInvoice, generateAllInvoices, generateInvoicesByLease } from '../store/slices/invoiceSlice';
import { fetchTenants } from '../store/slices/tenantSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import Sidebar from '../components/Sidebar';

const InvoicesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, currentInvoice, loading, error } = useSelector((state) => state.invoices);
  const { tenants } = useSelector((state) => state.tenants);
  const { properties } = useSelector((state) => state.properties);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState('single'); // 'single', 'all', 'by-lease'
  
  // Form data
  const [formData, setFormData] = useState({
    tenantId: '',
    propertyIds: [],
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    leaseStartDay: '',
    items: [], // Start with empty array - items will be added via currentItem
    notes: '',
    combineWithOtherInvoices: false
  });

  const [currentItem, setCurrentItem] = useState({ itemName: '', description: '', amount: '' });

  useEffect(() => {
    dispatch(fetchProperties());
    dispatch(fetchTenants());
    dispatch(fetchInvoices()).catch(err => {
      console.error('Error fetching invoices:', err);
    });
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePropertySelect = (propertyId, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        propertyIds: [...formData.propertyIds, propertyId]
      });
    } else {
      setFormData({
        ...formData,
        propertyIds: formData.propertyIds.filter(id => id !== propertyId)
      });
    }
  };

  const handleItemChange = (field, value) => {
    setCurrentItem({
      ...currentItem,
      [field]: value
    });
  };

  const handleAddItem = () => {
    if (currentItem.itemName && currentItem.amount) {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            itemName: currentItem.itemName,
            description: currentItem.description || '',
            amount: parseFloat(currentItem.amount)
          }
        ]
      });
      setCurrentItem({ itemName: '', description: '', amount: '' });
    }
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Note: Automatic items (rent, recurring charges) will be added by the backend
    // Additional items are optional

    // Filter out empty items (only send items with valid names and amounts)
    const validItems = formData.items
      .filter(item => item.itemName && item.itemName.trim() && item.amount && item.amount !== '')
      .map(item => ({
        itemName: item.itemName,
        description: item.description || '',
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      }));

    const submitData = {
      ...formData,
      items: validItems, // Can be empty array - backend will add automatic items
      invoiceDate: formData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate || null,
      notes: formData.notes || null
    };

    try {
      if (invoiceType === 'single') {
        if (!submitData.tenantId) {
          alert('Please select a tenant');
          return;
        }
        const result = await dispatch(createInvoice(submitData));
        if (createInvoice.rejected.match(result)) {
          alert(result.payload || 'Failed to create invoice');
          return;
        }
        alert('Invoice created successfully!');
      } else if (invoiceType === 'all') {
        const result = await dispatch(generateAllInvoices(submitData));
        if (generateAllInvoices.rejected.match(result)) {
          alert(result.payload || 'Failed to generate invoices');
          return;
        }
        alert(`Generated ${result.payload?.count || 0} invoice(s) successfully!`);
      } else if (invoiceType === 'by-lease') {
        if (!submitData.leaseStartDay) {
          alert('Please enter lease start day');
          return;
        }
        const result = await dispatch(generateInvoicesByLease(submitData));
        if (generateInvoicesByLease.rejected.match(result)) {
          alert(result.payload || 'Failed to generate invoices');
          return;
        }
        alert(`Generated ${result.payload?.count || 0} invoice(s) successfully!`);
      }

      // Reset form
      setShowCreateForm(false);
      setFormData({
        tenantId: '',
        propertyIds: [],
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        leaseStartDay: '',
        items: [],
        notes: '',
        combineWithOtherInvoices: false
      });
      
      // Refresh invoices list after a short delay to ensure backend has saved
      setTimeout(() => {
        dispatch(fetchInvoices()).catch(err => {
          console.error('Error refreshing invoices:', err);
        });
      }, 500);
    } catch (err) {
      console.error('Invoice creation error:', err);
      alert('An error occurred while creating the invoice. Please try again.');
    }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoices
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showCreateForm ? 'Cancel' : '+ Add Invoice'}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Create Invoice Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Invoice</h2>

              {/* Invoice Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Invoice Type</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setInvoiceType('single')}
                    className={`py-3 px-4 rounded-lg font-semibold transition ${
                      invoiceType === 'single'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Single Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceType('all')}
                    className={`py-3 px-4 rounded-lg font-semibold transition ${
                      invoiceType === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Tenants
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceType('by-lease')}
                    className={`py-3 px-4 rounded-lg font-semibold transition ${
                      invoiceType === 'by-lease'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    By Lease Date
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Single Tenant Selection */}
                {invoiceType === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Tenant <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tenantId"
                      value={formData.tenantId}
                      onChange={handleChange}
                      required={invoiceType === 'single'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant._id} value={tenant._id}>
                          {tenant.firstName} {tenant.lastName} 
                          {typeof tenant.propertyId === 'object' 
                            ? ` - ${tenant.propertyId.propertyName}` 
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Property Selection for All/By Lease */}
                {(invoiceType === 'all' || invoiceType === 'by-lease') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Properties (Leave empty for all properties)
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 border border-gray-300 rounded-lg">
                      {properties.map((property) => (
                        <label key={property._id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.propertyIds.includes(property._id)}
                            onChange={(e) => handlePropertySelect(property._id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{property.propertyName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lease Start Day for By Lease */}
                {invoiceType === 'by-lease' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lease Start Day (1-31) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="leaseStartDay"
                      value={formData.leaseStartDay}
                      onChange={handleChange}
                      required={invoiceType === 'by-lease'}
                      min="1"
                      max="31"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Generate invoices for tenants whose lease starts on this day of the month
                    </p>
                  </div>
                )}

                {/* Invoice Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Due Date */}
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

                {/* Invoice Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Invoice Items (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Rent and recurring charges (water, electricity, garbage, management fee, etc.) will be automatically included from the property and unit settings.
                  </p>
                  
                  {/* Existing Additional Items */}
                  {formData.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-semibold">{item.itemName}</div>
                            {item.description && (
                              <div className="text-sm text-gray-600">{item.description}</div>
                            )}
                            <div className="text-sm text-blue-600">KES {item.amount?.toLocaleString() || 0}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Item */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Item Name"
                      value={currentItem.itemName}
                      onChange={(e) => handleItemChange('itemName', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={currentItem.description}
                      onChange={(e) => handleItemChange('description', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount (KES)"
                        value={currentItem.amount}
                        onChange={(e) => handleItemChange('amount', e.target.value)}
                        step="0.01"
                        min="0"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Combine with Other Invoices */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="combineWithOtherInvoices"
                    checked={formData.combineWithOtherInvoices}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Combine with other invoices for the same month
                  </label>
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
                    {loading ? 'Creating...' : invoiceType === 'single' ? 'Create Invoice' : 'Generate Invoices'}
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

          {/* Invoices List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">All Invoices ({invoices.length})</h2>

            {loading ? (
              <p className="text-gray-600">Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Invoices</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{invoice.invoiceNumber}</td>
                        <td className="py-3 px-4">
                          {invoice.tenantId 
                            ? `${invoice.tenantId.firstName} ${invoice.tenantId.lastName}`
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {typeof invoice.propertyId === 'object' 
                            ? invoice.propertyId?.propertyName 
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">KES {invoice.total?.toLocaleString() || 0}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button 
                            onClick={async () => {
                              await dispatch(fetchSingleInvoice(invoice._id));
                              setShowViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* View Invoice Modal */}
          {showViewModal && currentInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Invoice Details</h2>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Invoice Number</p>
                      <p className="text-lg font-semibold text-gray-800">{currentInvoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        currentInvoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : currentInvoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {currentInvoice.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Invoice Date</p>
                      <p className="text-gray-800">{new Date(currentInvoice.invoiceDate).toLocaleDateString()}</p>
                    </div>
                    {currentInvoice.dueDate && (
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="text-gray-800">{new Date(currentInvoice.dueDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Tenant & Property Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Tenant</p>
                      <p className="text-gray-800">
                        {currentInvoice.tenantId 
                          ? `${currentInvoice.tenantId.firstName} ${currentInvoice.tenantId.lastName}`
                          : 'N/A'}
                      </p>
                      {currentInvoice.tenantId?.email && (
                        <p className="text-sm text-gray-600 mt-1">{currentInvoice.tenantId.email}</p>
                      )}
                      {currentInvoice.tenantId?.phoneNumber && (
                        <p className="text-sm text-gray-600">{currentInvoice.tenantId.phoneNumber}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Property</p>
                      <p className="text-gray-800">
                        {typeof currentInvoice.propertyId === 'object' 
                          ? currentInvoice.propertyId?.propertyName 
                          : 'N/A'}
                      </p>
                      {typeof currentInvoice.unitId === 'object' && currentInvoice.unitId?.unitId && (
                        <p className="text-sm text-gray-600 mt-1">Unit: {currentInvoice.unitId.unitId}</p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Items</h3>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-semibold text-gray-700">Item</th>
                          <th className="text-left py-2 px-4 font-semibold text-gray-700">Description</th>
                          <th className="text-right py-2 px-4 font-semibold text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentInvoice.items && currentInvoice.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">{item.itemName}</td>
                            <td className="py-3 px-4 text-gray-600">{item.description || '-'}</td>
                            <td className="py-3 px-4 text-right">KES {item.amount?.toLocaleString() || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2">
                          <td colSpan="2" className="py-3 px-4 text-right font-semibold text-gray-700">Subtotal:</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-800">
                            KES {currentInvoice.subtotal?.toLocaleString() || 0}
                          </td>
                        </tr>
                        {currentInvoice.tax > 0 && (
                          <tr>
                            <td colSpan="2" className="py-2 px-4 text-right text-gray-700">Tax:</td>
                            <td className="py-2 px-4 text-right text-gray-800">
                              KES {currentInvoice.tax?.toLocaleString() || 0}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t-2">
                          <td colSpan="2" className="py-3 px-4 text-right font-bold text-lg text-gray-800">Total:</td>
                          <td className="py-3 px-4 text-right font-bold text-lg text-blue-600">
                            KES {currentInvoice.total?.toLocaleString() || 0}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Notes */}
                  {currentInvoice.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Notes</p>
                      <p className="text-gray-800 bg-gray-50 p-3 rounded">{currentInvoice.notes}</p>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InvoicesPage;
