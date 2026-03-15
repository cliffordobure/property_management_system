import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';

const SupportPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('contact');
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium'
  });
  const [submitted, setSubmitted] = useState(false);

  const faqCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      questions: [
        {
          q: 'How do I create my first property?',
          a: 'Navigate to the Dashboard and click "Add Property". Fill in the required fields (property name, number of units, city) and any optional fields like water rate, electricity rate, or M-Pesa details. Click "Create Property" to save.'
        },
        {
          q: 'How do I add units to a property?',
          a: 'Go to the Dashboard and click "Add Unit". Select the property from the dropdown, enter the unit ID/name and rent amount. You can also set tax rates and recurring bills. Click "Create Unit" to save.'
        },
        {
          q: 'How do I add a tenant?',
          a: 'Navigate to the Dashboard and click "Add Tenant". Select the property and unit, then fill in the required information (first name, last name, phone number). Add optional information like deposit details, email, or lease dates. Click "Create Tenant" to save.'
        }
      ]
    },
    {
      id: 'invoices-payments',
      title: 'Invoices & Payments',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      questions: [
        {
          q: 'How do I create an invoice for a tenant?',
          a: 'Go to the Invoices page and click "Create Invoice". Select the tenant, property, and unit. The system will automatically include rent and any recurring charges. Add additional items if needed and click "Create Invoice".'
        },
        {
          q: 'Can I generate invoices for all tenants at once?',
          a: 'Yes! On the Invoices page, use the "Generate for All Tenants" option. You can also generate invoices for tenants based on their lease start date.'
        },
        {
          q: 'How do I record a payment?',
          a: 'Navigate to the Payments page, select the invoice, and enter the payment details including amount, payment method, and reference number. The invoice status will automatically update when payments are recorded.'
        },
        {
          q: 'What payment methods are supported?',
          a: 'You can record payments via M-Pesa, bank transfer, cash, cheque, or credit card. Payment methods can be configured when creating a property.'
        }
      ]
    },
    {
      id: 'tenants',
      title: 'Tenant Management',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      questions: [
        {
          q: 'How do tenants access their dashboard?',
          a: 'Tenants need to register with the same email address used when adding them to a property. After registration, they can log in and will automatically be linked to their tenant record.'
        },
        {
          q: 'What if a tenant cannot access their dashboard?',
          a: 'Ensure the tenant\'s email in their tenant record matches the email used for their user account. The system will automatically link accounts with matching emails. If issues persist, contact support.'
        },
        {
          q: 'Can I update tenant information?',
          a: 'Yes, you can update tenant information at any time through the Tenants page. Click on a tenant to view and edit their details, including contact information, lease dates, and other information.'
        }
      ]
    },
    {
      id: 'sms-communication',
      title: 'SMS & Communication',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      questions: [
        {
          q: 'How do I set up SMS notifications?',
          a: 'Go to Communication → SMS Settings. Enter your Africa\'s Talking API credentials (API Key and Username). Configure your sender ID and enable automatic reminders if needed.'
        },
        {
          q: 'Can I send SMS to multiple tenants?',
          a: 'Yes! On the Communication page, you can send SMS to a single tenant, selected tenants, or all tenants. You can also filter by property when sending to all tenants.'
        },
        {
          q: 'What automatic reminders are available?',
          a: 'You can enable automatic reminders for rent due dates, invoice overdue notices, lease expiry warnings, and payment confirmations. Configure these in Communication → SMS Settings.'
        }
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      questions: [
        {
          q: 'What reports are available?',
          a: 'The Reports page provides financial overviews, invoice statistics, payment analytics, expense tracking, utility reports, and maintenance statistics. You can filter reports by date range.'
        },
        {
          q: 'How do I filter reports by date?',
          a: 'Use the date range picker at the top of the Reports page. Select a start date and end date to filter all report data within that range.'
        },
        {
          q: 'Can I export reports?',
          a: 'Export functionality is coming soon. Currently, you can view all reports on the dashboard with filtering options.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      questions: [
        {
          q: 'I cannot log in to my account',
          a: 'Verify your email and password are correct. If you forgot your password, you\'ll need to contact support. Ensure your account is active and not deactivated.'
        },
        {
          q: 'My data is not loading',
          a: 'Check your internet connection. Clear your browser cache and refresh the page. If the issue persists, log out and log back in.'
        },
        {
          q: 'SMS is not sending',
          a: 'Verify your Africa\'s Talking API credentials are correct in Communication → SMS Settings. Ensure you have sufficient API credits. Check the SMS History to see error messages.'
        }
      ]
    }
  ];

  const [openFaq, setOpenFaq] = useState({});

  const toggleFaq = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    setOpenFaq(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, this would send to a backend API
    console.log('Support request:', {
      ...formData,
      user: user?.email,
      timestamp: new Date().toISOString()
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        subject: '',
        category: 'general',
        message: '',
        priority: 'medium'
      });
    }, 5000);
  };

  const quickLinks = [
    { title: 'Documentation', url: 'https://docs.turbine.com', icon: '📚' },
    { title: 'Video Tutorials', url: '/tutorials', icon: '🎥' },
    { title: 'API Documentation', url: 'https://api.turbine.com/docs', icon: '🔧' },
    { title: 'Community Forum', url: 'https://forum.turbine.com', icon: '💬' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {user?.role !== 'tenant' && <Sidebar />}
      <div className={user?.role !== 'tenant' ? 'flex-1 ml-64' : 'flex-1'}>
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Support
              </h1>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'contact'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Contact Support
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'faq'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                FAQ
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'resources'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Resources
              </button>
            </div>
          </div>

          {/* Contact Support Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Support</h2>
                
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Request Submitted!</h3>
                    <p className="text-green-700">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="Brief description of your issue"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                          <option value="general">General Inquiry</option>
                          <option value="technical">Technical Issue</option>
                          <option value="billing">Billing Question</option>
                          <option value="feature">Feature Request</option>
                          <option value="bug">Bug Report</option>
                          <option value="account">Account Issue</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="8"
                        placeholder="Please describe your issue or question in detail..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Contact Information:</strong>
                      </p>
                      <p className="text-sm text-blue-700 mt-2">
                        Email: {user?.email || 'Your email will be used'}
                      </p>
                      <p className="text-sm text-blue-700">
                        Name: {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Your name'}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Submit Support Request
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Other Ways to Reach Us</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                    <p className="text-sm text-gray-600">support@turbine.com</p>
                    <p className="text-sm text-gray-600">Available 24/7</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Phone</h3>
                    <p className="text-sm text-gray-600">+254 700 000 000</p>
                    <p className="text-sm text-gray-600">Mon-Fri, 9AM-5PM EAT</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Live Chat</h3>
                    <p className="text-sm text-gray-600">Available in-app</p>
                    <p className="text-sm text-gray-600">Mon-Fri, 9AM-5PM EAT</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              {faqCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-blue-600">
                      {category.icon}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">{category.title}</h2>
                  </div>
                  <div className="space-y-3">
                    {category.questions.map((faq, index) => {
                      const key = `${category.id}-${index}`;
                      const isOpen = openFaq[key];
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleFaq(category.id, index)}
                            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition"
                          >
                            <span className="font-medium text-gray-800">{faq.q}</span>
                            <svg
                              className={`w-5 h-5 text-gray-500 transform transition ${isOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                              <p className="text-gray-700">{faq.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                      <span className="text-3xl">{link.icon}</span>
                      <span className="font-medium text-gray-800">{link.title}</span>
                      <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Help Articles</h2>
                <div className="space-y-3">
                  {[
                    'Getting Started Guide',
                    'Setting Up Your First Property',
                    'Managing Invoices and Payments',
                    'Configuring SMS Notifications',
                    'Understanding Reports',
                    'Tenant Management Best Practices',
                    'Property Grouping Tutorial',
                    'Maintenance Request Workflow'
                  ].map((article, index) => (
                    <a
                      key={index}
                      href="#"
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                      <span className="text-gray-800">{article}</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
                <p className="mb-6 text-blue-100">
                  Can't find what you're looking for? Our support team is here to help you 24/7.
                </p>
                <button
                  onClick={() => setActiveTab('contact')}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SupportPage;
