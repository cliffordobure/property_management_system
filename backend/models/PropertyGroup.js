const mongoose = require('mongoose');

const propertyGroupSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  groupName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: null,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    trim: true
  },
  properties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PropertyGroup', propertyGroupSchema);
