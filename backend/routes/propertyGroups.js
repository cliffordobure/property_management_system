const express = require('express');
const PropertyGroup = require('../models/PropertyGroup');
const Property = require('../models/Property');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all property groups
router.get('/', auth, async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query = { organizationId: req.user.organizationId };
    
    if (includeInactive !== 'true') {
      query.isActive = true;
    }

    const groups = await PropertyGroup.find(query)
      .populate('properties', 'propertyName city numberOfUnits')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error('Get property groups error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single property group
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await PropertyGroup.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    }).populate('properties');

    if (!group) {
      return res.status(404).json({ message: 'Property group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Get property group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create property group
router.post('/', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { groupName, description, color, propertyIds } = req.body;

    if (!groupName) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Verify properties belong to organization if provided
    if (propertyIds && propertyIds.length > 0) {
      const properties = await Property.find({
        _id: { $in: propertyIds },
        organizationId: req.user.organizationId
      });

      if (properties.length !== propertyIds.length) {
        return res.status(400).json({ message: 'One or more properties not found or do not belong to your organization' });
      }
    }

    const group = new PropertyGroup({
      organizationId: req.user.organizationId,
      groupName: groupName.trim(),
      description: description || null,
      color: color || '#3B82F6',
      properties: propertyIds || []
    });

    await group.save();
    await group.populate('properties', 'propertyName city numberOfUnits');

    res.status(201).json(group);
  } catch (error) {
    console.error('Create property group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update property group
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { groupName, description, color, propertyIds, isActive } = req.body;

    const group = await PropertyGroup.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!group) {
      return res.status(404).json({ message: 'Property group not found' });
    }

    // Update basic fields
    if (groupName !== undefined) group.groupName = groupName.trim();
    if (description !== undefined) group.description = description || null;
    if (color !== undefined) group.color = color;
    if (isActive !== undefined) group.isActive = isActive;

    // Update properties if provided
    if (propertyIds !== undefined) {
      // Verify properties belong to organization
      if (propertyIds.length > 0) {
        const properties = await Property.find({
          _id: { $in: propertyIds },
          organizationId: req.user.organizationId
        });

        if (properties.length !== propertyIds.length) {
          return res.status(400).json({ message: 'One or more properties not found or do not belong to your organization' });
        }
      }
      group.properties = propertyIds;
    }

    await group.save();
    await group.populate('properties', 'propertyName city numberOfUnits');

    res.json(group);
  } catch (error) {
    console.error('Update property group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add properties to group
router.post('/:id/properties', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { propertyIds } = req.body;

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({ message: 'Property IDs array is required' });
    }

    const group = await PropertyGroup.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!group) {
      return res.status(404).json({ message: 'Property group not found' });
    }

    // Verify properties belong to organization
    const properties = await Property.find({
      _id: { $in: propertyIds },
      organizationId: req.user.organizationId
    });

    if (properties.length !== propertyIds.length) {
      return res.status(400).json({ message: 'One or more properties not found or do not belong to your organization' });
    }

    // Add properties (avoid duplicates)
    const existingIds = group.properties.map(id => id.toString());
    const newPropertyIds = propertyIds.filter(id => !existingIds.includes(id.toString()));
    group.properties = [...group.properties, ...newPropertyIds];

    await group.save();
    await group.populate('properties', 'propertyName city numberOfUnits');

    res.json(group);
  } catch (error) {
    console.error('Add properties to group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove properties from group
router.delete('/:id/properties', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const { propertyIds } = req.body;

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({ message: 'Property IDs array is required' });
    }

    const group = await PropertyGroup.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!group) {
      return res.status(404).json({ message: 'Property group not found' });
    }

    // Remove properties
    group.properties = group.properties.filter(id => !propertyIds.includes(id.toString()));

    await group.save();
    await group.populate('properties', 'propertyName city numberOfUnits');

    res.json(group);
  } catch (error) {
    console.error('Remove properties from group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete property group
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const group = await PropertyGroup.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!group) {
      return res.status(404).json({ message: 'Property group not found' });
    }

    res.json({ message: 'Property group deleted successfully' });
  } catch (error) {
    console.error('Delete property group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ungrouped properties
router.get('/properties/ungrouped', auth, async (req, res) => {
  try {
    // Get all property IDs that are in groups
    const groups = await PropertyGroup.find({
      organizationId: req.user.organizationId,
      isActive: true
    });
    
    const groupedPropertyIds = new Set();
    groups.forEach(group => {
      group.properties.forEach(propId => {
        groupedPropertyIds.add(propId.toString());
      });
    });

    // Get all properties for the organization
    const allProperties = await Property.find({
      organizationId: req.user.organizationId
    });

    // Filter out properties that are in groups
    const ungroupedProperties = allProperties.filter(prop => 
      !groupedPropertyIds.has(prop._id.toString())
    );

    res.json(ungroupedProperties);
  } catch (error) {
    console.error('Get ungrouped properties error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
