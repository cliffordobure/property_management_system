import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPayments, createPayment, fetchPaymentStats, approvePayment, rejectPayment } from '../store/slices/paymentSlice';
import { fetchInvoices } from '../store/slices/invoiceSlice';
import { fetchTenants } from '../store/slices/tenantSlice';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useMobileMenu } from '../hooks/useMobileMenu';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PaymentsPage = () => {
  const dispatch = useDispatch();
  const { payments, stats, loading, error } = useSelector((state) => state.payments);
  const { invoices } = useSelector((state) => state.invoices);
  const { tenants } = useSelector((state) => state.tenants);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'mpesa',
    referenceNumber: '',
    receiptNumber: '',
    notes: ''
  });
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyFormData, setVerifyFormData] = useState({
    referenceNumber: '',
    amount: ''
  });
  const [verifying, setVerifying] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const { isOpen, toggle } = useMobileMenu();

  useEffect(() => {
    dispatch(fetchPayments());
    dispatch(fetchInvoices());
    dispatch(fetchTenants());
    dispatch(fetchPaymentStats());
    fetchPendingPayments();
  }, [dispatch]);

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/payment-verification/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingPayments(response.data);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleInvoiceSelect = (invoiceId) => {
    const invoice = invoices.find(inv => inv._id === invoiceId);
    if (invoice) {
      // Calculate remaining balance
      const paidAmount = payments
        .filter(p => p.invoiceId?._id === invoiceId && p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const remainingBalance = (invoice.total || 0) - paidAmount;
      
      setFormData({
        ...formData,
        invoiceId: invoiceId,
        amount: remainingBalance > 0 ? remainingBalance.toString() : invoice.total?.toString() || ''
      });
    } else {
      setFormData({
        ...formData,
        invoiceId: invoiceId,
        amount: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.invoiceId || !formData.amount || !formData.paymentMethod) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate || new Date().toISOString().split('T')[0],
        referenceNumber: formData.referenceNumber || null,
        receiptNumber: formData.receiptNumber || null,
        notes: formData.notes || null
      };

      const result = await dispatch(createPayment(submitData));
      if (createPayment.rejected.match(result)) {
        alert(result.payload || 'Failed to create payment');
        return;
      }

      alert('Payment recorded successfully!');
      setShowCreateForm(false);
      setFormData({
        invoiceId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'mpesa',
        referenceNumber: '',
        receiptNumber: '',
        notes: ''
      });
      
      // Refresh data
      await dispatch(fetchPayments());
      await dispatch(fetchInvoices());
      await dispatch(fetchPaymentStats());
    } catch (err) {
      console.error('Payment creation error:', err);
      alert('An error occurred while recording the payment. Please try again.');
    }
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      mpesa: 'M-Pesa',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      cheque: 'Cheque',
      other: 'Other',
      manual: 'Manual'
    };
    return labels[method] || method;
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setVerifying(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/payment-verification/verify`, verifyFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.verified && response.data.matched) {
        alert('Payment verified and matched successfully! Receipt generated.');
        setShowVerifyModal(false);
        setVerifyFormData({ referenceNumber: '', amount: '' });
        await dispatch(fetchPayments());
        await dispatch(fetchInvoices());
        await dispatch(fetchPaymentStats());
        fetchPendingPayments();
      } else if (response.data.verified) {
        alert('Payment verified but no matching invoice found. Please create payment manually.');
      } else {
        alert(response.data.message || 'Payment not found');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert(error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerify = async (paymentId, verified) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/payment-verification/verify-manual`, {
        paymentId,
        verified
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(verified ? 'Payment verified successfully!' : 'Payment marked as failed');
      await dispatch(fetchPayments());
      await dispatch(fetchInvoices());
      await dispatch(fetchPaymentStats());
      fetchPendingPayments();
    } catch (error) {
      console.error('Error manually verifying payment:', error);
      alert(error.response?.data?.message || 'Failed to verify payment');
    }
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Payments
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <button
                onClick={() => setShowVerifyModal(true)}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                Verify Payment
              </button>
              {pendingPayments.length > 0 && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  {pendingPayments.length} Pending
                </span>
              )}
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                {showCreateForm ? 'Cancel' : '+ Record Payment'}
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-4 sm:py-8">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Total Payments</p>
                <p className="text-2xl font-bold text-gray-800">KES {stats.totalAmount?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.count || 0} transaction(s)</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">M-Pesa</p>
                <p className="text-2xl font-bold text-blue-600">KES {(stats.byMethod?.mpesa || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Other Methods</p>
                <p className="text-2xl font-bold text-green-600">
                  KES {((stats.byMethod?.bank_transfer || 0) + (stats.byMethod?.cash || 0) + (stats.byMethod?.cheque || 0) + (stats.byMethod?.other || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Create Payment Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Record Payment</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="invoiceId"
                      value={formData.invoiceId}
                      onChange={(e) => handleInvoiceSelect(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select an invoice</option>
                      {invoices
                        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
                        .map((invoice) => {
                          const paidAmount = payments
                            .filter(p => p.invoiceId?._id === invoice._id && p.status === 'completed')
                            .reduce((sum, p) => sum + (p.amount || 0), 0);
                          const remaining = (invoice.total || 0) - paidAmount;
                          
                          return (
                            <option key={invoice._id} value={invoice._id}>
                              {invoice.invoiceNumber} - {typeof invoice.tenantId === 'object' 
                                ? `${invoice.tenantId.firstName} ${invoice.tenantId.lastName}`
                                : 'N/A'} 
                              (Balance: KES {remaining.toLocaleString()})
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="manual">Manual (Cash/M-Pesa to Landlord)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

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
                    {loading ? 'Recording...' : 'Record Payment'}
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

          {/* Payments List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">All Payments ({payments.length})</h2>

            {loading ? (
              <p className="text-gray-600">Loading payments...</p>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Payments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by recording your first payment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Receipt</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Verification</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {typeof payment.invoiceId === 'object' 
                            ? payment.invoiceId?.invoiceNumber 
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {typeof payment.tenantId === 'object'
                            ? `${payment.tenantId.firstName} ${payment.tenantId.lastName}`
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          KES {payment.amount?.toLocaleString() || 0}
                        </td>
                        <td className="py-3 px-4">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {payment.referenceNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {payment.receiptNumber ? (
                            <span className="text-blue-600 font-medium">{payment.receiptNumber}</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {payment.bankVerificationStatus && payment.bankVerificationStatus !== 'not_required' ? (
                            <span className={`px-2 py-1 rounded text-xs ${
                              payment.bankVerificationStatus === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : payment.bankVerificationStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.bankVerificationStatus}
                              {payment.autoVerified && ' (Auto)'}
                            </span>
                          ) : payment.paymentMethod === 'manual' ? (
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                              Manual
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                              Not Required
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            payment.status === 'completed' || payment.status === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : payment.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            {payment.status === 'pending' && (
                              <>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to approve this payment?')) {
                                      try {
                                        await dispatch(approvePayment(payment._id));
                                        await dispatch(fetchPayments());
                                        await dispatch(fetchInvoices());
                                        await dispatch(fetchPaymentStats());
                                        fetchPendingPayments();
                                        alert('Payment approved successfully!');
                                      } catch (err) {
                                        alert(err.response?.data?.message || 'Failed to approve payment');
                                      }
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to reject this payment?')) {
                                      try {
                                        await dispatch(rejectPayment(payment._id));
                                        await dispatch(fetchPayments());
                                        await dispatch(fetchPaymentStats());
                                        fetchPendingPayments();
                                        alert('Payment rejected');
                                      } catch (err) {
                                        alert(err.response?.data?.message || 'Failed to reject payment');
                                      }
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {payment.referenceNumber && payment.bankVerificationStatus !== 'verified' && payment.status === 'completed' && (
                              <button
                                onClick={() => {
                                  setVerifyFormData({
                                    referenceNumber: payment.referenceNumber,
                                    amount: payment.amount.toString()
                                  });
                                  setShowVerifyModal(true);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                              >
                                Verify
                              </button>
                            )}
                            {payment.paymentMethod === 'manual' && payment.status === 'pending' && (
                              <button
                                onClick={() => handleManualVerify(payment._id, true)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                              >
                                Verify Manual
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Payments Section */}
          {pendingPayments.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Pending Payment Verification ({pendingPayments.length})
              </h2>
              <div className="space-y-3">
                {pendingPayments.map((payment) => (
                  <div key={payment._id} className="bg-white rounded-lg p-4 border border-yellow-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {typeof payment.tenantId === 'object' 
                            ? `${payment.tenantId.firstName} ${payment.tenantId.lastName}`
                            : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Invoice: {typeof payment.invoiceId === 'object' ? payment.invoiceId.invoiceNumber : 'N/A'} | 
                          Amount: KES {payment.amount?.toLocaleString()} | 
                          Reference: {payment.referenceNumber}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setVerifyFormData({
                            referenceNumber: payment.referenceNumber,
                            amount: payment.amount.toString()
                          });
                          setShowVerifyModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        Verify Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verify Payment Modal */}
          {showVerifyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Payment</h2>
                <p className="text-gray-600 mb-4">
                  Enter the reference number to verify payment with your connected bank accounts.
                </p>
                <form onSubmit={handleVerifyPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={verifyFormData.referenceNumber}
                      onChange={(e) => setVerifyFormData({ ...verifyFormData, referenceNumber: e.target.value })}
                      required
                      placeholder="Enter transaction/reference number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (Optional)
                    </label>
                    <input
                      type="number"
                      value={verifyFormData.amount}
                      onChange={(e) => setVerifyFormData({ ...verifyFormData, amount: e.target.value })}
                      placeholder="Expected amount"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVerifyModal(false);
                        setVerifyFormData({ referenceNumber: '', amount: '' });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {verifying ? 'Verifying...' : 'Verify Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PaymentsPage;
