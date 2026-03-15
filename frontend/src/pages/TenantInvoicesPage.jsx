import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TenantSidebar from '../components/TenantSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TenantInvoicesPage = () => {
  const dispatch = useDispatch();
  const { invoices, loading, error } = useSelector((state) => state.invoices);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'mpesa',
    referenceNumber: '',
    receiptNumber: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchMyInvoices = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/invoices`;
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // The backend should filter invoices for the tenant automatically
      dispatch({ type: 'invoices/fetchInvoices/fulfilled', payload: response.data });
    } catch (err) {
      console.error('Error fetching invoices:', err);
      dispatch({ type: 'invoices/fetchInvoices/rejected', payload: err.response?.data?.message || 'Failed to load invoices' });
    }
  }, [filterStatus, dispatch]);

  useEffect(() => {
    fetchMyInvoices();
  }, [fetchMyInvoices]);

  const handleView = async (invoice) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/invoices/${invoice._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedInvoice(response.data);
      setShowModal(true);
      setShowPaymentForm(false);
      // Pre-fill payment amount with invoice total if open/overdue
      if (response.data.status === 'open' || response.data.status === 'overdue') {
        setPaymentData({
          ...paymentData,
          amount: response.data.total?.toString() || ''
        });
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      alert(err.response?.data?.message || 'Failed to load invoice details');
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: value
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (submittingPayment) {
      return;
    }
    
    if (!paymentData.amount || !paymentData.paymentMethod) {
      alert('Please fill in amount and payment method');
      return;
    }

    if (parseFloat(paymentData.amount) <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    try {
      setSubmittingPayment(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/payments`, {
        invoiceId: selectedInvoice._id,
        paymentDate: new Date().toISOString().split('T')[0],
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber || undefined,
        receiptNumber: paymentData.receiptNumber || undefined,
        notes: paymentData.notes || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Payment submitted successfully! It is pending approval from your landlord.');
      setShowPaymentForm(false);
      setPaymentData({
        amount: '',
        paymentMethod: 'mpesa',
        referenceNumber: '',
        receiptNumber: '',
        notes: ''
      });
      
      // Refresh invoice details
      const invoiceResponse = await axios.get(`${API_URL}/invoices/${selectedInvoice._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedInvoice(invoiceResponse.data);
      
      // Refresh invoices list
      await fetchMyInvoices();
    } catch (err) {
      console.error('Error submitting payment:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to submit payment. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      partial: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredInvoices = invoices || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TenantSidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                My Invoices
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-800">{filteredInvoices.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0))}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredInvoices.filter(inv => inv.status === 'open').length}
                  </p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredInvoices.filter(inv => inv.status === 'overdue').length}
                  </p>
                </div>
                <div className="bg-red-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Invoices List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Invoice List</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices</h3>
                <p className="text-gray-500">You don't have any invoices yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => {
                      const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                      return (
                        <tr key={invoice._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                            {invoice.propertyId?.propertyName && (
                              <div className="text-sm text-gray-500">{invoice.propertyId.propertyName}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(invoice.invoiceDate)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(invoice.dueDate)}
                              {daysUntilDue !== null && invoice.status === 'open' && (
                                <div className={`text-xs mt-1 ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                  {daysUntilDue < 0 ? `Overdue by ${Math.abs(daysUntilDue)} days` : `${daysUntilDue} days remaining`}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                              {invoice.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleView(invoice)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* View Invoice Modal */}
          {showModal && selectedInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Invoice Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedInvoice(null);
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
                      <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getStatusColor(selectedInvoice.status)}`}>
                        {selectedInvoice.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                      <p className="font-semibold text-gray-800">{formatDate(selectedInvoice.invoiceDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Due Date</p>
                      <p className="font-semibold text-gray-800">{formatDate(selectedInvoice.dueDate)}</p>
                    </div>
                  </div>

                  {selectedInvoice.propertyId && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Property</p>
                        <p className="font-semibold text-gray-800">{selectedInvoice.propertyId.propertyName}</p>
                      </div>
                      {selectedInvoice.unitId && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Unit</p>
                          <p className="font-semibold text-gray-800">{selectedInvoice.unitId.unitId}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invoice Items */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Items</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInvoice.items && selectedInvoice.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Invoice Totals */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                        </div>
                        {selectedInvoice.tax > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax:</span>
                            <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.tax)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                          <span className="text-gray-800">Total:</span>
                          <span className="text-blue-600">{formatCurrency(selectedInvoice.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedInvoice.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Notes</p>
                      <p className="text-gray-800 bg-gray-50 p-4 rounded">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {/* Make Payment Section */}
                  {(selectedInvoice.status === 'open' || selectedInvoice.status === 'overdue' || selectedInvoice.status === 'partial') && (
                    <div className="border-t border-gray-200 pt-6">
                      {!showPaymentForm ? (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Make Payment</h3>
                          <button
                            onClick={() => setShowPaymentForm(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Make Payment
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Submit Payment</h3>
                            <button
                              onClick={() => {
                                setShowPaymentForm(false);
                                setPaymentData({
                                  amount: selectedInvoice.total?.toString() || '',
                                  paymentMethod: 'mpesa',
                                  referenceNumber: '',
                                  receiptNumber: '',
                                  notes: ''
                                });
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <form onSubmit={handleSubmitPayment} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (KES)
                              </label>
                              <input
                                type="number"
                                name="amount"
                                value={paymentData.amount}
                                onChange={handlePaymentChange}
                                min="0.01"
                                step="0.01"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter amount"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method *
                              </label>
                              <select
                                name="paymentMethod"
                                value={paymentData.paymentMethod}
                                onChange={handlePaymentChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="mpesa">M-Pesa</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="cheque">Cheque</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference Number
                              </label>
                              <input
                                type="text"
                                name="referenceNumber"
                                value={paymentData.referenceNumber}
                                onChange={handlePaymentChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., M-Pesa transaction code"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Receipt Number
                              </label>
                              <input
                                type="text"
                                name="receiptNumber"
                                value={paymentData.receiptNumber}
                                onChange={handlePaymentChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Optional receipt number"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                              </label>
                              <textarea
                                name="notes"
                                value={paymentData.notes}
                                onChange={handlePaymentChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Additional payment notes (optional)"
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={submittingPayment}
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submittingPayment ? 'Submitting...' : 'Submit Payment'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPaymentForm(false);
                                  setPaymentData({
                                    amount: selectedInvoice.total?.toString() || '',
                                    paymentMethod: 'mpesa',
                                    referenceNumber: '',
                                    receiptNumber: '',
                                    notes: ''
                                  });
                                }}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedInvoice(null);
                      setShowPaymentForm(false);
                      setPaymentData({
                        amount: '',
                        paymentMethod: 'mpesa',
                        referenceNumber: '',
                        receiptNumber: '',
                        notes: ''
                      });
                    }}
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

export default TenantInvoicesPage;
