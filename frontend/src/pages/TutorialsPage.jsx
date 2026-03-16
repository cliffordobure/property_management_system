import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';

const TutorialsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Helper function to extract YouTube video ID from URL or ID
  const getYouTubeEmbedUrl = (videoIdOrUrl) => {
    // If it's already just an ID, use it
    if (!videoIdOrUrl.includes('youtube.com') && !videoIdOrUrl.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${videoIdOrUrl}`;
    }
    
    // Extract ID from YouTube URL
    let videoId = '';
    if (videoIdOrUrl.includes('youtube.com/watch?v=')) {
      videoId = videoIdOrUrl.split('v=')[1]?.split('&')[0];
    } else if (videoIdOrUrl.includes('youtu.be/')) {
      videoId = videoIdOrUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (videoIdOrUrl.includes('youtube.com/embed/')) {
      videoId = videoIdOrUrl.split('embed/')[1]?.split('?')[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const tutorialCategories = [
    { id: 'all', name: 'All Tutorials', icon: '📚' },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'properties', name: 'Properties & Units', icon: '🏠' },
    { id: 'tenants', name: 'Tenant Management', icon: '👥' },
    { id: 'financial', name: 'Invoices & Payments', icon: '💰' },
    { id: 'communication', name: 'SMS & Communication', icon: '💬' },
    { id: 'reports', name: 'Reports & Analytics', icon: '📊' }
  ];

  const tutorials = [
    {
      id: 1,
      title: 'Welcome to Fancyfy - Getting Started',
      description: 'Learn the basics of Fancyfy property management system and how to navigate the dashboard.',
      category: 'getting-started',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '5:32',
      thumbnail: null
    },
    {
      id: 2,
      title: 'How to Add Your First Property',
      description: 'Step-by-step guide on adding properties, setting up rates, and configuring property details.',
      category: 'properties',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '8:15',
      thumbnail: null
    },
    {
      id: 3,
      title: 'Managing Units in Your Properties',
      description: 'Learn how to add units, set rent amounts, and manage unit-specific settings.',
      category: 'properties',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '6:45',
      thumbnail: null
    },
    {
      id: 4,
      title: 'Adding and Managing Tenants',
      description: 'Complete guide on adding tenants, linking accounts, and managing tenant information.',
      category: 'tenants',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '10:20',
      thumbnail: null
    },
    {
      id: 5,
      title: 'Creating Invoices for Tenants',
      description: 'Learn how to create individual invoices, bulk invoices, and automate recurring charges.',
      category: 'financial',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '12:30',
      thumbnail: null
    },
    {
      id: 6,
      title: 'Recording Payments and Tracking',
      description: 'How to record payments, update invoice statuses, and track payment history.',
      category: 'financial',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '7:18',
      thumbnail: null
    },
    {
      id: 7,
      title: 'Setting Up SMS Notifications',
      description: 'Configure Africa\'s Talking SMS integration and set up automatic reminders.',
      category: 'communication',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '9:45',
      thumbnail: null
    },
    {
      id: 8,
      title: 'Sending Bulk SMS to Tenants',
      description: 'Learn how to send individual and bulk SMS messages to your tenants.',
      category: 'communication',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '6:22',
      thumbnail: null
    },
    {
      id: 9,
      title: 'Understanding Reports and Analytics',
      description: 'Explore financial reports, property statistics, and data analytics features.',
      category: 'reports',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '11:10',
      thumbnail: null
    },
    {
      id: 10,
      title: 'Managing Expenses and Utilities',
      description: 'Track property expenses, utility bills, and maintenance costs effectively.',
      category: 'financial',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '8:50',
      thumbnail: null
    },
    {
      id: 11,
      title: 'Maintenance Request Management',
      description: 'How to create maintenance requests, assign contractors, and track status.',
      category: 'properties',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '9:30',
      thumbnail: null
    },
    {
      id: 12,
      title: 'Property Grouping and Organization',
      description: 'Organize your properties into groups for better management and reporting.',
      category: 'properties',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID or URL
      duration: '7:45',
      thumbnail: null
    }
  ];

  const filteredTutorials = selectedCategory === 'all'
    ? tutorials
    : tutorials.filter(t => t.category === selectedCategory);

  const [selectedVideo, setSelectedVideo] = useState(null);

  const openVideoModal = (tutorial) => {
    setSelectedVideo(tutorial);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {user?.role !== 'tenant' && <Sidebar />}
      <div className={user?.role !== 'tenant' ? 'flex-1 ml-64' : 'flex-1'}>
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Video Tutorials
              </h1>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Learn Fancyfy Step by Step</h2>
                <p className="text-blue-100">Watch video tutorials to master property management</p>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              {tutorialCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tutorials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => {
              const embedUrl = getYouTubeEmbedUrl(tutorial.videoId);
              const thumbnailUrl = `https://img.youtube.com/vi/${tutorial.videoId.split('/').pop()}/maxresdefault.jpg`;
              
              return (
                <div
                  key={tutorial.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  {/* Video Thumbnail */}
                  <div className="relative cursor-pointer" onClick={() => openVideoModal(tutorial)}>
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {embedUrl ? (
                        <>
                          <img
                            src={thumbnailUrl}
                            alt={tutorial.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://img.youtube.com/vi/${tutorial.videoId}/hqdefault.jpg`;
                            }}
                          />
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition">
                            <div className="bg-white bg-opacity-90 rounded-full p-4 hover:scale-110 transition">
                              <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                          </svg>
                        </div>
                      )}
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {tutorial.duration}
                      </div>
                    </div>
                  </div>

                  {/* Tutorial Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                        {tutorialCategories.find(c => c.id === tutorial.category)?.name || tutorial.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">
                      {tutorial.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {tutorial.description}
                    </p>
                    <button
                      onClick={() => openVideoModal(tutorial)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Watch Tutorial
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredTutorials.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tutorials Found</h3>
              <p className="text-gray-500">Try selecting a different category.</p>
            </div>
          )}

          {/* Video Modal */}
          {selectedVideo && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={closeVideoModal}
            >
              <div
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{selectedVideo.title}</h2>
                    <p className="text-sm text-gray-600">{selectedVideo.description}</p>
                  </div>
                  <button
                    onClick={closeVideoModal}
                    className="ml-4 text-gray-500 hover:text-gray-700 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Video Player */}
                <div className="p-6">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {getYouTubeEmbedUrl(selectedVideo.videoId) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(selectedVideo.videoId) + '?autoplay=1'}
                        title={selectedVideo.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                          </svg>
                          <p>Video not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Info */}
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Duration: {selectedVideo.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{tutorialCategories.find(c => c.id === selectedVideo.category)?.name || selectedVideo.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Can't Find What You're Looking For?</h3>
            <p className="text-purple-100 mb-6">
              Our support team is here to help. Contact us for personalized assistance.
            </p>
            <a
              href="/support"
              className="inline-block bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
            >
              Contact Support
            </a>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TutorialsPage;
