import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUnits } from '../store/slices/unitSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import Sidebar from '../components/Sidebar';

const UnitsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { units, loading } = useSelector((state) => state.units);
  const { properties } = useSelector((state) => state.properties);
  const [selectedProperty, setSelectedProperty] = useState('');

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProperty) {
      dispatch(fetchUnits(selectedProperty));
    } else {
      dispatch(fetchUnits());
    }
  }, [dispatch, selectedProperty]);

  const filteredUnits = units;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Units
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/units/add"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Add Unit
              </Link>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
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
            </div>
          </div>

          {/* Units List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">All Units ({filteredUnits.length})</h2>
            </div>

            {loading ? (
              <p className="text-gray-600">Loading units...</p>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No units found.</p>
                <Link
                  to="/units/add"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Your First Unit
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rent Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.map((unit) => (
                      <tr key={unit._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{unit.unitId}</td>
                        <td className="py-3 px-4">
                          {typeof unit.propertyId === 'object' ? unit.propertyId?.propertyName : 'N/A'}
                        </td>
                        <td className="py-3 px-4">KES {unit.rentAmount?.toLocaleString() || '0'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            unit.isOccupied
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {unit.isOccupied ? 'Occupied' : 'Available'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/units/${unit._id}`)}
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
        </main>
      </div>
    </div>
  );
};

export default UnitsPage;
