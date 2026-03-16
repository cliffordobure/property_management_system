import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ListingFeesPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [payForm, setPayForm] = useState({
    paymentMethod: 'mpesa',
    paymentReference: '',
    notes: ''
  });

  useEffect(() => {
    if (user?.listingType !== 'advertise_only') {
      navigate('/dashboard');
      return;
    }
    const fetchFees = async () => {
      try {
        const res = await axios.get(`${API_URL}/listing-fees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFees(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, [token, user?.listingType, navigate]);

  const openPayModal = (fee) => {
    setSelectedFee(fee);
    setPayForm({ paymentMethod: 'mpesa', paymentReference: '', notes: '' });
    setShowPayModal(true);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;
    setPayingId(selectedFee._id);
    try {
      await axios.post(
        `${API_URL}/listing-fees/${selectedFee._id}/pay`,
        payForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFees((prev) =>
        prev.map((f) =>
          f._id === selectedFee._id ? { ...f, status: 'paid' } : f
        )
      );
      setShowPayModal(false);
      setSelectedFee(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPayingId(null);
    }
  };

  const pendingFees = fees.filter((f) => f.status === 'pending');
  const paidFees = fees.filter((f) => f.status === 'paid');

  if (user?.listingType !== 'advertise_only') return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Listing Fees</h1>
          </div>
        </header>

        <main className="px-6 py-8 max-w-4xl">
          <p className="text-gray-600 mb-6">
            Pay the one-time listing fee for each property to make it visible on Fancyfy. Until paid, your property will not appear in the public listings.
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {pendingFees.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Pending payment</h2>
                  <div className="space-y-3">
                    {pendingFees.map((fee) => (
                      <div
                        key={fee._id}
                        className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {fee.propertyId?.propertyName || 'Property'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {fee.propertyId?.city}
                            {fee.propertyId?.location && ` · ${fee.propertyId.location}`}
                          </p>
                          <p className="text-sm font-semibold text-amber-800 mt-1">
                            {fee.amount?.toLocaleString()} {fee.currency}
                          </p>
                        </div>
                        <button
                          onClick={() => openPayModal(fee)}
                          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
                        >
                          Pay now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {paidFees.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Paid</h2>
                  <div className="space-y-2">
                    {paidFees.map((fee) => (
                      <div
                        key={fee._id}
                        className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {fee.propertyId?.propertyName || 'Property'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Paid {fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <span className="text-green-700 font-medium">Listed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fees.length === 0 && !loading && (
                <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
                  <p>No listing fees yet.</p>
                  <p className="mt-2 text-sm">When you add a property as an &quot;Advertise only&quot; landlord, a listing fee will appear here. Pay it to list the property on Fancyfy.</p>
                  <button
                    onClick={() => navigate('/properties/add')}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Add a property
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showPayModal && selectedFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Record listing fee payment</h3>
            <p className="text-gray-600 text-sm mb-4">
              {selectedFee.propertyId?.propertyName} — {selectedFee.amount?.toLocaleString()} {selectedFee.currency}
            </p>
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / transaction ID</label>
                <input
                  type="text"
                  value={payForm.paymentReference}
                  onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
                  placeholder="e.g. receipt number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPayModal(false); setSelectedFee(null); }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payingId === selectedFee._id}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {payingId === selectedFee._id ? 'Recording...' : 'Confirm payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingFeesPage;
