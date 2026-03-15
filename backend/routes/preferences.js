const express = require('express');
const UserPreferences = require('../models/UserPreferences');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user preferences
router.get('/', auth, async (req, res) => {
  try {
    let preferences = await UserPreferences.findOne({ userId: req.user._id });

    if (!preferences) {
      // Create default preferences
      preferences = new UserPreferences({
        userId: req.user._id,
        organizationId: req.user.organizationId
      });
      await preferences.save();
    }

    res.json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user preferences
router.put('/', auth, async (req, res) => {
  try {
    let preferences = await UserPreferences.findOne({ userId: req.user._id });

    if (!preferences) {
      preferences = new UserPreferences({
        userId: req.user._id,
        organizationId: req.user.organizationId,
        ...req.body
      });
    } else {
      Object.assign(preferences, req.body);
    }

    await preferences.save();
    res.json({ preferences, message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
