import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProperties } from '../store/slices/propertySlice';
import { fetchUnits } from '../store/slices/unitSlice';
import { fetchTenants } from '../store/slices/tenantSlice';
import Sidebar from '../components/Sidebar';

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { properties } = useSelector((state) => state.properties);
  const { units, loading: unitsLoading } = useSelector((state) => state.units);
  const { tenants, loading: tenantsLoading } = useSelector((state) => state.tenants);

  const [property, setProperty] = useState(null);

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  useEffect(() => {
    if (properties.length > 0) {
      const foundProperty = properties.find(p => p._id === id);
      setProperty(foundProperty);
      if (foundProperty) {
        dispatch(fetchUnits(foundProperty._id));
        dispatch(fetchTenants({ propertyId: foundProperty._id }));
      }
    }
  }, [properties, id, dispatch]);

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Property not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const propertyUnits = units.filter(u => {
    const propId = typeof u.propertyId === 'object' ? u.propertyId?._id : u.propertyId;
    return propId === id;
  });
  const propertyTenants = tenants.filter(t => {
    const propId = typeof t.propertyId === 'object' ? t.propertyId?._id : t.propertyId;
    return propId === id;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-800">{property.propertyName}</h1>
              <p className="text-gray-600">{property.city}</p>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 max-w-6xl">

        {/* Property Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Property Name</p>
              <p className="font-semibold">{property.propertyName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Units</p>
              <p className="font-semibold">{property.numberOfUnits}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">City</p>
              <p className="font-semibold">{property.city}</p>
            </div>
            {property.streetName && (
              <div>
                <p className="text-sm text-gray-600">Street Name</p>
                <p className="font-semibold">{property.streetName}</p>
              </div>
            )}
            {property.companyName && (
              <div>
                <p className="text-sm text-gray-600">Company Name</p>
                <p className="font-semibold">{property.companyName}</p>
              </div>
            )}
            {property.waterRate && (
              <div>
                <p className="text-sm text-gray-600">Water Rate</p>
                <p className="font-semibold">KES {property.waterRate}</p>
              </div>
            )}
            {property.electricityRate && (
              <div>
                <p className="text-sm text-gray-600">Electricity Rate</p>
                <p className="font-semibold">KES {property.electricityRate}</p>
              </div>
            )}
            {property.mpesaPaybill && (
              <div>
                <p className="text-sm text-gray-600">MPESA Paybill</p>
                <p className="font-semibold">{property.mpesaPaybill}</p>
              </div>
            )}
            {property.mpesaTill && (
              <div>
                <p className="text-sm text-gray-600">MPESA Till</p>
                <p className="font-semibold">{property.mpesaTill}</p>
              </div>
            )}
            {property.taxRate && (
              <div>
                <p className="text-sm text-gray-600">Tax Rate</p>
                <p className="font-semibold">{property.taxRate}%</p>
              </div>
            )}
            {property.garbageBill && (
              <div>
                <p className="text-sm text-gray-600">Garbage Bill</p>
                <p className="font-semibold">KES {property.garbageBill}</p>
              </div>
            )}
            {property.managementFee && (
              <div>
                <p className="text-sm text-gray-600">Management Fee</p>
                <p className="font-semibold">KES {property.managementFee}</p>
              </div>
            )}
            {property.rentPaymentPenalty && (
              <div>
                <p className="text-sm text-gray-600">Rent Payment Penalty</p>
                <p className="font-semibold">KES {property.rentPaymentPenalty}</p>
              </div>
            )}
          </div>
          {property.otherRecurringBills && property.otherRecurringBills.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Other Recurring Bills</p>
              <div className="space-y-1">
                {property.otherRecurringBills.map((bill, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{bill.name}</span>
                    <span className="font-semibold">KES {bill.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {property.notes && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              <p className="text-gray-800">{property.notes}</p>
            </div>
          )}
          {property.paymentInstructions && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Payment Instructions</p>
              <p className="text-gray-800">{property.paymentInstructions}</p>
            </div>
          )}
        </div>

        {/* Units Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Units ({propertyUnits.length})</h2>
            <button
              onClick={() => navigate('/units/add')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Unit
            </button>
          </div>
          {unitsLoading ? (
            <p className="text-gray-600">Loading units...</p>
          ) : propertyUnits.length === 0 ? (
            <p className="text-gray-600">No units added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rent Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyUnits.map((unit) => (
                    <tr key={unit._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{unit.unitId}</td>
                      <td className="py-3 px-4">KES {unit.rentAmount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          unit.isOccupied 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {unit.isOccupied ? 'Occupied' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tenants Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Tenants ({propertyTenants.length})</h2>
            <button
              onClick={() => navigate('/tenants/add')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Tenant
            </button>
          </div>
          {tenantsLoading ? (
            <p className="text-gray-600">Loading tenants...</p>
          ) : propertyTenants.length === 0 ? (
            <p className="text-gray-600">No tenants registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyTenants.map((tenant) => (
                    <tr key={tenant._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {tenant.firstName} {tenant.lastName}
                      </td>
                      <td className="py-3 px-4">{tenant.phoneNumber}</td>
                      <td className="py-3 px-4">
                        {typeof tenant.unitId === 'object' ? tenant.unitId?.unitId : 'N/A'}
                      </td>
                      <td className="py-3 px-4">{tenant.email || 'N/A'}</td>
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

export default PropertyDetailsPage;
