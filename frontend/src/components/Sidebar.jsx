import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [expandedSections, setExpandedSections] = useState({
    financials: false,
    propertyUnit: true,
    settings: false
  });

  // Debug: Log user role to console (remove in production)
  React.useEffect(() => {
    if (user) {
      console.log('Sidebar - User role:', user.role, 'User object:', user);
    }
  }, [user]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar - dark background so white text is visible; h-screen + min-h-0 on nav so it scrolls */}
      <div className={`bg-slate-900 text-white w-64 h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Logo - fixed at top */}
      <div className="flex-shrink-0 p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white tracking-tight">Fancyfy</h1>
        <p className="text-slate-300 text-sm mt-0.5">Property Management</p>
      </div>

      {/* Navigation - scrollable when content overflows */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-4 px-3">
        <ul className="space-y-1">
          {/* Dashboard */}
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 rounded-xl transition ${
                isActive('/dashboard') && location.pathname === '/dashboard'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
          </li>

          {/* Listing Fees - for advertise-only landlords */}
          {user?.listingType === 'advertise_only' && (
            <li>
              <Link
                to="/listing-fees"
                className={`flex items-center px-4 py-3 rounded-xl transition ${
                  isActive('/listing-fees')
                    ? 'bg-white/10 text-white'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Listing Fees
              </Link>
            </li>
          )}

          {/* Financials - hidden for advertise-only (they use Listing Fees only) */}
          {user?.listingType !== 'advertise_only' && (
          <li>
            <button
              onClick={() => toggleSection('financials')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                expandedSections.financials || isActive('/financials')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Financials
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${expandedSections.financials ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {expandedSections.financials && (
              <ul className="ml-4 mt-1 space-y-1">
                <li>
                  <Link
                    to="/financials/invoices"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/financials/invoices')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Invoices
                  </Link>
                </li>
                <li>
                  <Link
                    to="/financials/payments"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/financials/payments')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Payments
                  </Link>
                </li>
                <li>
                  <Link
                    to="/financials/expenses"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/financials/expenses')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Expenses
                  </Link>
                </li>
                <li>
                  <Link
                    to="/financials/bank-accounts"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/financials/bank-accounts')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Bank Accounts
                  </Link>
                </li>
              </ul>
            )}
          </li>
          )}

          {/* Tenants - hidden for advertise-only */}
          {user?.listingType !== 'advertise_only' && (
          <li>
            <Link
              to="/tenants"
              className={`flex items-center px-4 py-3 rounded-xl transition ${
                isActive('/tenants')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Tenants
            </Link>
          </li>
          )}

          {/* Property/Unit */}
          <li>
            <button
              onClick={() => toggleSection('propertyUnit')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                expandedSections.propertyUnit || isActive('/properties') || isActive('/units')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Property/Unit
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${expandedSections.propertyUnit ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {expandedSections.propertyUnit && (
              <ul className="ml-4 mt-1 space-y-1">
                <li>
                  <Link
                    to="/dashboard"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      location.pathname === '/dashboard'
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Properties
                  </Link>
                </li>
                <li>
                  <Link
                    to="/units"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/units')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Units
                  </Link>
                </li>
                <li>
                  <Link
                    to="/utilities"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/utilities')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Utilities
                  </Link>
                </li>
                <li>
                  <Link
                    to="/maintenance"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/maintenance')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Maintenance
                  </Link>
                </li>
                <li>
                  <Link
                    to="/property-grouping"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/property-grouping')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Property Grouping
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Reports */}
          <li>
            <Link
              to="/reports"
              className={`flex items-center px-4 py-3 rounded-xl transition ${
                isActive('/reports')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reports
            </Link>
          </li>

          {/* Overdue Items */}
          <li>
            <Link
              to="/overdue"
              className={`flex items-center px-4 py-3 rounded-xl transition ${
                isActive('/overdue')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Overdue Items
            </Link>
          </li>

          {/* Claims & Complaints */}
          <li>
            <Link
              to="/claims-complaints"
              className={`flex items-center px-4 py-3 rounded-xl transition ${
                isActive('/claims-complaints')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Claims & Complaints
            </Link>
          </li>

          {/* Managers (Landlord and Admin only) */}
          {(user?.role === 'landlord' || user?.role === 'admin') && (
            <li>
              <Link
                to="/managers"
                className={`flex items-center px-4 py-3 rounded-xl transition ${
                  isActive('/managers')
                    ? 'bg-white/10 text-white'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Managers / Caretakers
              </Link>
            </li>
          )}

          {/* Communication */}
          <li>
            <Link
              to="/communication"
              className={`flex items-center px-4 py-3 rounded-xl transition ${
                isActive('/communication')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Communication
            </Link>
          </li>

          {/* Settings */}
          <li>
            <button
              onClick={() => toggleSection('settings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                expandedSections.settings || isActive('/settings')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${expandedSections.settings ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {expandedSections.settings && (
              <ul className="ml-4 mt-1 space-y-1">
                <li>
                  <Link
                    to="/settings/profile"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/settings/profile')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/settings/preferences"
                    className={`flex items-center px-4 py-2 rounded-xl transition ${
                      isActive('/settings/preferences')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Preferences
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>

      {/* Bottom Navigation - fixed at bottom */}
      <div className="flex-shrink-0 border-t border-slate-700 p-4 space-y-1">
        <Link
          to="/support"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/support')
              ? 'bg-white/10 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Support
        </Link>
        <Link
          to="/tutorials"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/tutorials')
              ? 'bg-white/10 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tutorials
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;
