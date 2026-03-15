const express = require('express');
const AuditLog = require('../models/AuditLog');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(auth);
router.use(requireRole('admin'));

// Get all audit logs
router.get('/', async (req, res) => {
  try {
    const {
      category,
      userId,
      organizationId,
      status,
      startDate,
      endDate,
      resourceType,
      action,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // Filters
    if (category) query.category = category;
    if (userId) query.userId = userId;
    if (organizationId) query.organizationId = organizationId;
    if (status) query.status = status;
    if (resourceType) query.resourceType = resourceType;
    if (action) query.action = { $regex: action, $options: 'i' };

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'email firstName lastName role')
        .populate('organizationId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single audit log
router.get('/:id', async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('userId', 'email firstName lastName role')
      .populate('organizationId', 'name');

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get audit log statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};

    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = end;
      }
    }

    const [totalLogs, byCategory, byStatus, byUserRole, recentActions] = await Promise.all([
      AuditLog.countDocuments(dateQuery),
      AuditLog.aggregate([
        { $match: dateQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $match: dateQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $match: { ...dateQuery, userRole: { $exists: true, $ne: null } } },
        { $group: { _id: '$userRole', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.find(dateQuery)
        .select('action createdAt category')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.json({
      totalLogs,
      byCategory,
      byStatus,
      byUserRole,
      recentActions
    });
  } catch (error) {
    console.error('Get audit log stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
