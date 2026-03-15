import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LandingPage = () => {
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({
    country: '',
    city: '',
    location: ''
  });
  const [selectedRole, setSelectedRole] = useState('landlord');
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [showPreVisitModal, setShowPreVisitModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [preVisitForm, setPreVisitForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    requestedDate: '',
    requestedTime: '',
    preferredContactMethod: 'phone',
    message: ''
  });
  const [submittingPreVisit, setSubmittingPreVisit] = useState(false);

  useEffect(() => {
    fetchAvailableUnits();
  }, [page, filters]);

  useEffect(() => {
    fetchPricingPlans();
  }, []); // Only fetch pricing plans once on mount

  const fetchAvailableUnits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (filters.country && filters.country.trim()) params.append('country', filters.country.trim());
      if (filters.city && filters.city.trim()) params.append('city', filters.city.trim());
      if (filters.location && filters.location.trim()) params.append('location', filters.location.trim());

      const response = await axios.get(`${API_URL}/units/public/available?${params.toString()}`);
      if (page === 1) {
        setAvailableUnits(response.data.units);
      } else {
        setAvailableUnits(prev => [...prev, ...response.data.units]);
      }
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error fetching available units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to page 1 when filters change
  };

  const handleShowMore = () => {
    setPage(prev => prev + 1);
  };

  const fetchPricingPlans = async () => {
    try {
      setLoadingPricing(true);
      console.log('Fetching pricing plans from:', `${API_URL}/admin/subscription-plans/public`);
      const response = await axios.get(`${API_URL}/subscription-plans/public`);
      console.log('Pricing plans response status:', response.status);
      console.log('Pricing plans response data:', response.data);
      // Ensure we're working with an array
      const plans = Array.isArray(response.data) ? response.data : [];
      console.log(`Setting ${plans.length} pricing plans:`, plans.map(p => p.name || p.displayName));
      setPricingPlans(plans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Full error:', error);
      // Set empty array on error to show fallback message
      setPricingPlans([]);
    } finally {
      setLoadingPricing(false);
    }
  };

  const formatCurrency = (amount, currency = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatUnitRange = (maxUnits) => {
    if (!maxUnits) return 'Unlimited units';
    if (maxUnits <= 5) return `Up to ${maxUnits} units`;
    if (maxUnits <= 20) return `5-20 units`;
    if (maxUnits <= 50) return `21-50 units`;
    if (maxUnits <= 100) return `51-100 units`;
    return `Above 100 units`;
  };

  const getBillingPeriodText = (period) => {
    switch (period) {
      case 'monthly': return 'month';
      case 'quarterly': return 'quarter';
      case 'yearly': return 'year';
      default: return 'month';
    }
  };

  const handleBookPreVisit = (unit) => {
    setSelectedUnit(unit);
    setShowPreVisitModal(true);
  };

  const handlePreVisitSubmit = async (e) => {
    e.preventDefault();
    
    if (!preVisitForm.visitorName || !preVisitForm.visitorPhone || !preVisitForm.requestedDate || !preVisitForm.requestedTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingPreVisit(true);
      const response = await axios.post(`${API_URL}/pre-visits/public/book`, {
        propertyId: selectedUnit.propertyId._id,
        unitId: selectedUnit._id,
        ...preVisitForm
      });
      
      alert('Pre-visit request submitted successfully! The landlord will be notified and contact you soon.');
      setShowPreVisitModal(false);
      setPreVisitForm({
        visitorName: '',
        visitorPhone: '',
        visitorEmail: '',
        requestedDate: '',
        requestedTime: '',
        preferredContactMethod: 'phone',
        message: ''
      });
      setSelectedUnit(null);
    } catch (error) {
      console.error('Error booking pre-visit:', error);
      alert(error.response?.data?.message || 'Failed to book pre-visit. Please try again.');
    } finally {
      setSubmittingPreVisit(false);
    }
  };

  // Role-specific content data
  const roleContent = {
    landlord: {
      cards: [
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          title: "Collect on time — automatically",
          description: "Reminders, receipts, and reconciliation run in the background so you don't have to chase payments."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          title: "Know who's paid (and who hasn't)",
          description: "Clear arrears views, exportable reports, and quick filters keep you in control."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
          ),
          title: "Free your time",
          description: "Spend fewer hours on admin and more on growing your rental income."
        }
      ],
      buttonText: "Learn more for landlords",
      buttonLink: "/features/landlords"
    },
    propertyManager: {
      cards: [
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: "Boost collections",
          description: "Automate payment tracking, receipts, penalties, and audit trails across portfolios."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          title: "Real-time landlord reports",
          description: "One-click statements and sharable dashboards keep clients informed and happy."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
          title: "Scale without extra hires",
          description: "Standardise processes and manage 5 times more units with the same team."
        }
      ],
      buttonText: "Learn more for property managers",
      buttonLink: "/features/property-managers"
    },
    serviceCharge: {
      cards: [
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          title: "Automated billing & receipts",
          description: "Generate and send SMS invoices and instant receipts for estate levies—no manual paperwork."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          ),
          title: "Integrated payments, auto-posted",
          description: "Card, mobile money, and bank payments sync back to member accounts automatically—no double entry."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: "Clear balances & statements",
          description: "Real-time member records and one-click statements reduce disputes and keep estates transparent."
        }
      ],
      buttonText: "Learn more for service charge managers",
      buttonLink: "/features/service-charge"
    },
    waterBilling: {
      cards: [
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          title: "Meter-based invoices, automated",
          description: "Generate accurate bills from readings and send via SMS—no spreadsheets or manual entry."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          title: "Instant SMS receipts",
          description: "Customers get receipts automatically after payment; you see updates in real time."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          title: "Balances & arrears at a glance",
          description: "See who's paid and who hasn't, export reports, and close the month without confusion."
        }
      ],
      buttonText: "Learn more for water billing",
      buttonLink: "/features/water-billing"
    },
    garbageCollection: {
      cards: [
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          title: "Automated client billing",
          description: "Send monthly invoices by SMS, track payments instantly, and reduce missed collections."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
          title: "Payments auto-posted",
          description: "Mobile money and bank payments sync back to accounts automatically—no double entry."
        },
        {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: "Clear arrears & reports",
          description: "Real-time client records and one-click reports keep teams aligned and month-end easy."
        }
      ],
      buttonText: "Learn more for garbage collection",
      buttonLink: "/features/garbage-collection"
    }
  };

  const currentContent = roleContent[selectedRole];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-black text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-400">TURBINE</div>
          <div className="hidden md:flex gap-6 items-center">
            <Link to="#" className="hover:text-blue-400 transition">Features</Link>
            <Link to="#" className="hover:text-blue-400 transition">Pricing</Link>
            <Link to="#" className="hover:text-blue-400 transition">FAQs</Link>
            <Link to="#" className="hover:text-blue-400 transition">Usecases</Link>
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/login" className="hover:text-blue-400 transition">Sign In</Link>
            <Link 
              to="/login" 
              className="bg-black border border-white px-4 py-2 rounded hover:bg-gray-900 transition"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Video Section */}
            <div>
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Turbine Property Management Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Marketing Message */}
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Stop Chasing Rent. <span className="text-blue-600">Start Earning More.</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Easy-to-use Property Management System for landlords and property managers in Kenya and the rest of Africa.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/login"
                  className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
                >
                  Get started free
                </Link>
                <Link
                  to="/login"
                  className="bg-white border-2 border-black text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-8">Trusted Across Africa</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="border-2 border-blue-500 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">✓</div>
              <div className="text-2xl font-bold text-blue-600">550+</div>
              <div className="text-gray-600">Landlords & PMs</div>
            </div>
            <div className="border-2 border-blue-500 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">🏠</div>
              <div className="text-2xl font-bold text-blue-600">1,000+</div>
              <div className="text-gray-600">Properties</div>
            </div>
            <div className="border-2 border-blue-500 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-2xl font-bold text-blue-600">20,000+</div>
              <div className="text-gray-600">Tenants Managed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Apartments Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-8">Available Apartments</h2>
          
          {/* Search Filters */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gray-100 rounded-lg p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={filters.country}
                    onChange={handleFilterChange}
                    placeholder="e.g., Kenya"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    placeholder="e.g., Nairobi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location/Area</label>
                  <input
                    type="text"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="e.g., Westlands"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Units Grid */}
          {loading && page === 1 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading available apartments...</p>
            </div>
          ) : availableUnits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No available apartments found. Please try different search filters.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-8">
                {availableUnits.map((unit) => (
                  <div key={unit._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition border border-gray-200">
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{unit.propertyId?.propertyName || 'Property'}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Unit {unit.unitId}
                        </p>
                      </div>
                      <div className="space-y-2 mb-4">
                        {unit.propertyId?.country && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Country:</span> {unit.propertyId.country}
                          </p>
                        )}
                        {unit.propertyId?.city && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">City:</span> {unit.propertyId.city}
                          </p>
                        )}
                        {unit.propertyId?.location && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span> {unit.propertyId.location}
                          </p>
                        )}
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(unit.rentAmount)}</p>
                        <p className="text-sm text-gray-500">per month</p>
                      </div>
                      <button
                        onClick={() => handleBookPreVisit(unit)}
                        className="mt-4 w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Book Pre-Visit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={handleShowMore}
                    disabled={loading}
                    className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Show More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Why Choose Us</h2>
          <p className="text-gray-600 text-center mb-8">Pick your role to see the benefits that matter most to you.</p>
          
          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-4xl mx-auto">
            <button 
              onClick={() => setSelectedRole('landlord')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedRole === 'landlord'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {selectedRole === 'landlord' ? '' : '• '}Landlord
            </button>
            <button 
              onClick={() => setSelectedRole('propertyManager')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedRole === 'propertyManager'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {selectedRole === 'propertyManager' ? '' : '• '}Property Manager
            </button>
            <button 
              onClick={() => setSelectedRole('serviceCharge')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedRole === 'serviceCharge'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {selectedRole === 'serviceCharge' ? '' : '• '}Service Charge
            </button>
            <button 
              onClick={() => setSelectedRole('waterBilling')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedRole === 'waterBilling'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {selectedRole === 'waterBilling' ? '' : '• '}Water Billing
            </button>
            <button 
              onClick={() => setSelectedRole('garbageCollection')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedRole === 'garbageCollection'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {selectedRole === 'garbageCollection' ? '' : '• '}Garbage Collection
            </button>
          </div>

          {/* Benefit Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
            {currentContent.cards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to={currentContent.buttonLink}
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              {currentContent.buttonText} →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Pricing</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Note: All plans have all the features. The only difference is the number of units.
            We have a special plan for users managing less than 5 units, or <strong>low income rentals</strong>.
          </p>

          {loadingPricing ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading pricing plans...</p>
            </div>
          ) : pricingPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No pricing plans available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {pricingPlans.map((plan) => (
                <div key={plan._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{plan.displayName?.toUpperCase() || plan.name.toUpperCase()}</h3>
                  <div className="mb-4">
                    {plan.name === 'enterprise' ? (
                      <span className="text-gray-600 text-lg">Contact Us for Pricing</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">{plan.price.toLocaleString()}</span>
                        <span className="text-gray-600 ml-2">{plan.currency?.toLowerCase() || 'kshs'} / {getBillingPeriodText(plan.billingPeriod)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center mb-6 text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {formatUnitRange(plan.features?.maxUnits)}
                  </div>
                  <Link
                    to="/login"
                    className="block w-full bg-black text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
                  >
                    {plan.name === 'basic' || plan.name === 'free' ? 'Try Free' : 'Start Now'} →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Schedule Demo Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-8">Schedule Demo</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-100 rounded-lg p-8">
              <p className="text-gray-700 mb-6">Feel free to reach out for any inquiries.</p>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Format: +2547.........)
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+254712345678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a ...</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Landlord</option>
                    <option>Property Manager</option>
                    <option>Tenant</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rental Units or Customers</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>1-20</option>
                    <option>21-50</option>
                    <option>51-100</option>
                    <option>Above 100</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your message"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="recaptcha" className="w-4 h-4" />
                  <label htmlFor="recaptcha" className="text-sm text-gray-700">I'm not a robot</label>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Visit Booking Modal */}
      {showPreVisitModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Book Pre-Visit</h2>
                <button
                  onClick={() => {
                    setShowPreVisitModal(false);
                    setSelectedUnit(null);
                    setPreVisitForm({
                      visitorName: '',
                      visitorPhone: '',
                      visitorEmail: '',
                      requestedDate: '',
                      requestedTime: '',
                      preferredContactMethod: 'phone',
                      message: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedUnit.propertyId?.propertyName || 'Property'}</h3>
                <p className="text-sm text-gray-600">Unit {selectedUnit.unitId}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">{formatCurrency(selectedUnit.rentAmount)} per month</p>
              </div>

              <form onSubmit={handlePreVisitSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={preVisitForm.visitorName}
                      onChange={(e) => setPreVisitForm({ ...preVisitForm, visitorName: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={preVisitForm.visitorPhone}
                      onChange={(e) => setPreVisitForm({ ...preVisitForm, visitorPhone: e.target.value })}
                      required
                      placeholder="+254712345678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={preVisitForm.visitorEmail}
                    onChange={(e) => setPreVisitForm({ ...preVisitForm, visitorEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={preVisitForm.requestedDate}
                      onChange={(e) => setPreVisitForm({ ...preVisitForm, requestedDate: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={preVisitForm.requestedTime}
                      onChange={(e) => setPreVisitForm({ ...preVisitForm, requestedTime: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Contact Method
                  </label>
                  <select
                    value={preVisitForm.preferredContactMethod}
                    onChange={(e) => setPreVisitForm({ ...preVisitForm, preferredContactMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="phone">Phone Call</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={preVisitForm.message}
                    onChange={(e) => setPreVisitForm({ ...preVisitForm, message: e.target.value })}
                    placeholder="Any additional information or questions..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can book up to 4 pre-visits per day. The landlord will be notified and will contact you to confirm the visit.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreVisitModal(false);
                      setSelectedUnit(null);
                      setPreVisitForm({
                        visitorName: '',
                        visitorPhone: '',
                        visitorEmail: '',
                        requestedDate: '',
                        requestedTime: '',
                        preferredContactMethod: 'phone',
                        message: ''
                      });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPreVisit}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingPreVisit ? 'Submitting...' : 'Book Pre-Visit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-4">TURBINE</div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold mb-4">Ready to get started?</p>
              <Link 
                to="/login" 
                className="inline-block bg-gray-200 text-black px-6 py-2 rounded hover:bg-gray-300 transition"
              >
                Get Started Free →
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-4">All Pages</h3>
                <div className="space-y-2 text-sm">
                  <div><Link to="#" className="hover:text-blue-400">Features</Link></div>
                  <div><Link to="#" className="hover:text-blue-400">Pricing</Link></div>
                  <div><Link to="#" className="hover:text-blue-400">FAQs</Link></div>
                  <div><Link to="#" className="hover:text-blue-400">Blog</Link></div>
                  <div><Link to="#" className="hover:text-blue-400">Tutorials</Link></div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-4">Contact Us</h3>
                <div className="space-y-2 text-sm">
                  <p>Phone: +254 715 938069</p>
                  <p>Email: support@turbine.com</p>
                  <p>Nairobi, Kenya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
