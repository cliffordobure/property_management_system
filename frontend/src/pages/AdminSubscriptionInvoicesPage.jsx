import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminSubscriptionInvoicesPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'receipts'
  const [loading, setLoading] = useState(true);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [generateFormData, setGenerateFormData] = useState({
    organizationId: '',
    billingPeriod: 'monthly',
    periodStart: '',
    periodEnd: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'mpesa',
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate, activeTab, filterOrg, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'invoices') {
        let url = `${API_URL}/subscription-invoices`;
        const params = new URLSearchParams();
        if (filterOrg) params.append('organizationId', filterOrg);
        if (filterStatus) params.append('status', filterStatus);
        if (params.toString()) url += `?${params.toString()}`;

        const invoicesRes = await axios.get(url, { headers });
        setInvoices(invoicesRes.data);
      } else {
        let url = `${API_URL}/subscription-invoices/receipts`;
        const params = new URLSearchParams();
        if (filterOrg) params.append('organizationId', filterOrg);
        if (params.toString()) url += `?${params.toString()}`;

        const receiptsRes = await axios.get(url, { headers });
        setReceipts(receiptsRes.data);
      }

      // Fetch organizations for filter
      const orgsRes = await axios.get(`${API_URL}/admin/organizations`, { headers });
      setOrganizations(orgsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/subscription-invoices/generate`, generateFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Invoice generated successfully!');
      setShowGenerateForm(false);
      setGenerateFormData({
        organizationId: '',
        billingPeriod: 'monthly',
        periodStart: '',
        periodEnd: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert(error.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/subscription-invoices/${selectedInvoice._id}/pay`,
        paymentFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Payment recorded and receipt generated successfully!');
      setShowPaymentForm(false);
      setSelectedInvoice(null);
      setPaymentFormData({
        amount: '',
        paymentMethod: 'mpesa',
        referenceNumber: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleMarkReceiptSent = async (receiptId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/subscription-invoices/receipts/${receiptId}/mark-sent`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Receipt marked as sent!');
      fetchData();
    } catch (error) {
      console.error('Error marking receipt:', error);
      alert('Failed to mark receipt as sent');
    }
  };

  if (loading && invoices.length === 0 && receipts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Subscription Invoices & Receipts</h1>
            <div className="flex gap-4">
              <select
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>{org.name}</option>
                ))}
              </select>
              {activeTab === 'invoices' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              )}
              {activeTab === 'invoices' && (
                <button
                  onClick={() => setShowGenerateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Generate Invoice
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invoices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Invoices ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab('receipts')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'receipts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Receipts ({receipts.length})
              </button>
            </nav>
          </div>

          {/* Generate Invoice Form */}
          {showGenerateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Generate Subscription Invoice</h2>
              <form onSubmit={handleGenerateInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                  <select
                    value={generateFormData.organizationId}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, organizationId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Billing Period</label>
                  <select
                    value={generateFormData.billingPeriod}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, billingPeriod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Period Start</label>
                    <input
                      type="date"
                      value={generateFormData.periodStart}
                      onChange={(e) => setGenerateFormData({ ...generateFormData, periodStart: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Period End</label>
                    <input
                      type="date"
                      value={generateFormData.periodEnd}
                      onChange={(e) => setGenerateFormData({ ...generateFormData, periodEnd: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowGenerateForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Generate Invoice
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Form */}
          {showPaymentForm && selectedInvoice && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Record Payment</h2>
              <p className="text-gray-600 mb-4">
                Invoice: {selectedInvoice.invoiceNumber} - {selectedInvoice.planName.toUpperCase()} Plan
                <br />
                Amount: {selectedInvoice.planPrice.toLocaleString()} {selectedInvoice.currency}
              </p>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    placeholder={selectedInvoice.planPrice}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={paymentFormData.referenceNumber}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, referenceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedInvoice(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Invoices Table */}
          {activeTab === 'invoices' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Subscription Invoices</h2>
              {invoices.length === 0 ? (
                <p className="text-gray-600">No invoices found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.organizationId?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.planName.toUpperCase()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.totalUnits}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            {invoice.planPrice.toLocaleString()} {invoice.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invoice.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {invoice.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setPaymentFormData({ amount: invoice.planPrice, paymentMethod: 'mpesa', referenceNumber: '', notes: '' });
                                  setShowPaymentForm(true);
                                }}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Record Payment
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
          )}

          {/* Receipts Table */}
          {activeTab === 'receipts' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Receipts</h2>
              {receipts.length === 0 ? (
                <p className="text-gray-600">No receipts found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {receipts.map((receipt) => (
                        <tr key={receipt._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{receipt.receiptNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{receipt.organizationId?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{receipt.subscriptionInvoiceId?.invoiceNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            {receipt.amount.toLocaleString()} {receipt.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{receipt.paymentMethod.replace('_', ' ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(receipt.receiptDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {receipt.sentToLandlord ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Yes
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!receipt.sentToLandlord && (
                              <button
                                onClick={() => handleMarkReceiptSent(receipt._id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Mark as Sent
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
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminSubscriptionInvoicesPage;
