import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPropertyGroups, createPropertyGroup, updatePropertyGroup, deletePropertyGroup, addPropertiesToGroup, removePropertiesFromGroup, fetchUngroupedProperties } from '../store/slices/propertyGroupSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import Sidebar from '../components/Sidebar';

const PropertyGroupingPage = () => {
  const dispatch = useDispatch();
  const { propertyGroups, ungroupedProperties, loading, error } = useSelector((state) => state.propertyGroups);
  const { properties } = useSelector((state) => state.properties);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPropertiesModal, setShowAddPropertiesModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    color: '#3B82F6',
    propertyIds: []
  });

  const [availableProperties, setAvailableProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);

  useEffect(() => {
    dispatch(fetchPropertyGroups());
    dispatch(fetchProperties());
    dispatch(fetchUngroupedProperties());
  }, [dispatch]);

  useEffect(() => {
    if (showAddPropertiesModal && selectedGroup && properties) {
      // Get all properties not in the selected group
      const groupPropertyIds = selectedGroup.properties?.map(p => 
        typeof p === 'object' ? p._id : p
      ) || [];
      const available = properties.filter(p => !groupPropertyIds.includes(p._id));
      setAvailableProperties(available);
    }
  }, [showAddPropertiesModal, selectedGroup, properties]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePropertyToggle = (propertyId) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.groupName) {
      alert('Please enter a group name');
      return;
    }

    try {
      const submitData = {
        ...formData,
        propertyIds: selectedProperties.length > 0 ? selectedProperties : []
      };

      const result = await dispatch(createPropertyGroup(submitData));
      if (createPropertyGroup.rejected.match(result)) {
        alert(result.payload || 'Failed to create property group');
        return;
      }

      alert('Property group created successfully!');
      setShowCreateForm(false);
      setFormData({
        groupName: '',
        description: '',
        color: '#3B82F6',
        propertyIds: []
      });
      setSelectedProperties([]);
      
      // Refresh data
      await dispatch(fetchPropertyGroups());
      await dispatch(fetchUngroupedProperties());
    } catch (err) {
      console.error('Property group creation error:', err);
      alert('An error occurred while creating the property group. Please try again.');
    }
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setFormData({
      groupName: group.groupName,
      description: group.description || '',
      color: group.color || '#3B82F6',
      propertyIds: group.properties?.map(p => typeof p === 'object' ? p._id : p) || []
    });
    setSelectedProperties(group.properties?.map(p => typeof p === 'object' ? p._id : p) || []);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.groupName) {
      alert('Please enter a group name');
      return;
    }

    try {
      const updateData = {
        ...formData,
        propertyIds: selectedProperties
      };

      const result = await dispatch(updatePropertyGroup({
        id: selectedGroup._id,
        data: updateData
      }));

      if (updatePropertyGroup.rejected.match(result)) {
        alert(result.payload || 'Failed to update property group');
        return;
      }

      alert('Property group updated successfully!');
      setShowEditModal(false);
      setSelectedGroup(null);
      
      // Refresh data
      await dispatch(fetchPropertyGroups());
      await dispatch(fetchUngroupedProperties());
    } catch (err) {
      console.error('Property group update error:', err);
      alert('An error occurred while updating the property group. Please try again.');
    }
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this property group? Properties will not be deleted.')) {
      return;
    }

    try {
      const result = await dispatch(deletePropertyGroup(groupId));
      if (deletePropertyGroup.rejected.match(result)) {
        alert(result.payload || 'Failed to delete property group');
        return;
      }

      alert('Property group deleted successfully!');
      
      // Refresh data
      await dispatch(fetchPropertyGroups());
      await dispatch(fetchUngroupedProperties());
    } catch (err) {
      console.error('Property group deletion error:', err);
      alert('An error occurred while deleting the property group. Please try again.');
    }
  };

  const handleAddProperties = (group) => {
    setSelectedGroup(group);
    setSelectedProperties([]);
    setShowAddPropertiesModal(true);
  };

  const handleAddPropertiesSubmit = async () => {
    if (selectedProperties.length === 0) {
      alert('Please select at least one property to add');
      return;
    }

    try {
      const result = await dispatch(addPropertiesToGroup({
        id: selectedGroup._id,
        propertyIds: selectedProperties
      }));

      if (addPropertiesToGroup.rejected.match(result)) {
        alert(result.payload || 'Failed to add properties to group');
        return;
      }

      alert('Properties added to group successfully!');
      setShowAddPropertiesModal(false);
      setSelectedGroup(null);
      setSelectedProperties([]);
      
      // Refresh data
      await dispatch(fetchPropertyGroups());
      await dispatch(fetchUngroupedProperties());
    } catch (err) {
      console.error('Add properties error:', err);
      alert('An error occurred while adding properties. Please try again.');
    }
  };

  const handleRemoveProperty = async (groupId, propertyId) => {
    if (!window.confirm('Are you sure you want to remove this property from the group?')) {
      return;
    }

    try {
      const result = await dispatch(removePropertiesFromGroup({
        id: groupId,
        propertyIds: [propertyId]
      }));

      if (removePropertiesFromGroup.rejected.match(result)) {
        alert(result.payload || 'Failed to remove property from group');
        return;
      }

      alert('Property removed from group successfully!');
      
      // Refresh data
      await dispatch(fetchPropertyGroups());
      await dispatch(fetchUngroupedProperties());
    } catch (err) {
      console.error('Remove property error:', err);
      alert('An error occurred while removing the property. Please try again.');
    }
  };

  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Property Grouping
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showCreateForm ? 'Cancel' : '+ Create Group'}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Create Group Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Property Group</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="groupName"
                    value={formData.groupName}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Downtown Properties, Commercial Buildings"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the purpose of this group..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <div className="flex gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Properties (Optional)</label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {ungroupedProperties.length === 0 ? (
                      <p className="text-sm text-gray-500">No ungrouped properties available</p>
                    ) : (
                      <div className="space-y-2">
                        {ungroupedProperties.map((property) => (
                          <label key={property._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedProperties.includes(property._id)}
                              onChange={() => handlePropertyToggle(property._id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{property.propertyName}</p>
                              <p className="text-sm text-gray-600">{property.city} • {property.numberOfUnits} units</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ groupName: '', description: '', color: '#3B82F6', propertyIds: [] });
                      setSelectedProperties([]);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Group'}
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

          {/* Property Groups List */}
          <div className="space-y-6">
            {loading && propertyGroups.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600">Loading property groups...</p>
              </div>
            ) : propertyGroups.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Property Groups</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first property group.</p>
              </div>
            ) : (
              propertyGroups.map((group) => (
                <div key={group._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Group Header */}
                  <div className="px-6 py-4 border-b" style={{ borderLeft: `4px solid ${group.color || '#3B82F6'}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: group.color || '#3B82F6' }}
                          />
                          <h3 className="text-lg font-semibold text-gray-800">{group.groupName}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                            {group.properties?.length || 0} {group.properties?.length === 1 ? 'property' : 'properties'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddProperties(group)}
                          className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium"
                        >
                          + Add Properties
                        </button>
                        <button
                          onClick={() => handleEdit(group)}
                          className="text-gray-600 hover:text-gray-700 px-3 py-1 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(group._id)}
                          className="text-red-600 hover:text-red-700 px-3 py-1 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {group.description && (
                      <p className="mt-2 text-sm text-gray-600">{group.description}</p>
                    )}
                  </div>

                  {/* Properties List */}
                  <div className="px-6 py-4">
                    {group.properties && group.properties.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.properties.map((property) => {
                          const prop = typeof property === 'object' ? property : properties.find(p => p._id === property);
                          if (!prop) return null;
                          
                          return (
                            <div key={prop._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-800">{prop.propertyName}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{prop.city}</p>
                                  <p className="text-xs text-gray-500 mt-1">{prop.numberOfUnits} units</p>
                                </div>
                                <button
                                  onClick={() => handleRemoveProperty(group._id, prop._id)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                  title="Remove from group"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No properties in this group yet. Add properties to get started.</p>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Ungrouped Properties Section */}
            {ungroupedProperties.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Ungrouped Properties ({ungroupedProperties.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ungroupedProperties.map((property) => (
                    <div key={property._id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800">{property.propertyName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{property.city}</p>
                      <p className="text-xs text-gray-500 mt-1">{property.numberOfUnits} units</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit Modal */}
          {showEditModal && selectedGroup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Edit Property Group</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedGroup(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="groupName"
                      value={formData.groupName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <div className="flex gap-2">
                        {presetColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Properties</label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {properties.length === 0 ? (
                        <p className="text-sm text-gray-500">No properties available</p>
                      ) : (
                        <div className="space-y-2">
                          {properties.map((property) => (
                            <label key={property._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedProperties.includes(property._id)}
                                onChange={() => handlePropertyToggle(property._id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">{property.propertyName}</p>
                                <p className="text-sm text-gray-600">{property.city} • {property.numberOfUnits} units</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedGroup(null);
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Updating...' : 'Update Group'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Properties Modal */}
          {showAddPropertiesModal && selectedGroup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Add Properties to {selectedGroup.groupName}</h2>
                  <button
                    onClick={() => {
                      setShowAddPropertiesModal(false);
                      setSelectedGroup(null);
                      setSelectedProperties([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  {availableProperties.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">All properties are already in this group.</p>
                  ) : (
                    <>
                      <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto mb-4">
                        <div className="space-y-2">
                          {availableProperties.map((property) => (
                            <label key={property._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedProperties.includes(property._id)}
                                onChange={() => handlePropertyToggle(property._id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">{property.propertyName}</p>
                                <p className="text-sm text-gray-600">{property.city} • {property.numberOfUnits} units</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPropertiesModal(false);
                            setSelectedGroup(null);
                            setSelectedProperties([]);
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddPropertiesSubmit}
                          disabled={loading || selectedProperties.length === 0}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Adding...' : `Add ${selectedProperties.length} Property${selectedProperties.length !== 1 ? 'ies' : ''}`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PropertyGroupingPage;
