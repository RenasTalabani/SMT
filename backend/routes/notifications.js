const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const { protect, authorize } = require('../middlewares/auth');
const { validateObjectId, validatePagination } = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { recipient: req.user._id };

    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }
    if (req.query.type) filter.type = req.query.type;

    const notifications = await Notification.find(filter)
      .populate('sender', 'name avatar role')
      .populate('data.workoutPlan', 'title')
      .populate('data.course', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sender', 'name avatar role')
      .populate('relatedUser', 'name avatar')
      .populate('data.workoutPlan', 'title description')
      .populate('data.course', 'title description');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Only recipient can view
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this notification'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/notifications
// @desc    Create notification
// @access  Private/Admin/Coach
router.post('/', protect, authorize('coach', 'admin'), async (req, res) => {
  try {
    const {
      recipient,
      type,
      title,
      message,
      category,
      priority,
      relatedWorkoutPlan,
      relatedCourse,
      actionUrl
    } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'category is required'
      });
    }

    // Verify recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const notification = await Notification.create({
      recipient,
      sender: req.user._id,
      type,
      title,
      message,
      category,
      priority,
      data: {
        workoutPlan: relatedWorkoutPlan || undefined,
        course: relatedCourse || undefined
      },
      actionUrl,
      isRead: false
    });

    res.status(201).json({
      success: true,
      data: { notification },
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, validateObjectId, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Only recipient can mark as read
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this notification as read'
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.post('/mark-all-read', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      data: { updatedCount: result.modifiedCount },
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Only recipient can delete
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/notifications/bulk-delete
// @desc    Delete multiple notifications
// @access  Private
router.post('/bulk-delete', protect, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs array is required'
      });
    }

    // Verify all notifications belong to user
    const notifications = await Notification.find({
      _id: { $in: notificationIds },
      recipient: req.user._id
    });

    if (notifications.length !== notificationIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some notifications not found or not authorized to delete'
      });
    }

    await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: req.user._id
    });

    res.json({
      success: true,
      data: { deletedCount: notificationIds.length },
      message: 'Notifications deleted successfully'
    });
  } catch (error) {
    console.error('Bulk delete notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/notifications/send-workout-reminder
// @desc    Send workout reminder notification
// @access  Private/Coach
router.post('/send-workout-reminder', protect, authorize('coach', 'admin'), async (req, res) => {
  try {
    const { clientId, workoutPlanId } = req.body;

    const client = await User.findById(clientId);
    const workoutPlan = await WorkoutPlan.findById(workoutPlanId);

    if (!client || !workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Client or workout plan not found'
      });
    }

    await Notification.create({
      recipient: clientId,
      sender: req.user._id,
      type: 'reminder',
      title: 'Workout Reminder',
      message: `Don't forget your workout: ${workoutPlan.title}`,
      category: 'reminder',
      data: { workoutPlan: workoutPlanId },
      actionUrl: `/workouts/${workoutPlanId}`
    });

    res.json({
      success: true,
      message: 'Workout reminder sent successfully'
    });
  } catch (error) {
    console.error('Send workout reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/notifications/send-progress-update
// @desc    Send progress update notification
// @access  Private/Coach
router.post('/send-progress-update', protect, authorize('coach', 'admin'), async (req, res) => {
  try {
    const { clientId, message } = req.body;

    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await Notification.create({
      recipient: clientId,
      sender: req.user._id,
      type: 'coach_feedback',
      title: 'Progress Update',
      message: message || 'Your coach has updated your progress. Check your dashboard for details.',
      category: 'progress',
      actionUrl: '/progress'
    });

    res.json({
      success: true,
      message: 'Progress update notification sent successfully'
    });
  } catch (error) {
    console.error('Send progress update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/notifications/send-system-announcement
// @desc    Send system announcement to all users
// @access  Private/Admin
router.post('/send-system-announcement', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, targetRoles = ['client', 'coach'] } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const recipients = await User.find({ role: { $in: targetRoles } }).select('_id');

    const notifications = recipients.map(recipient => ({
      recipient: recipient._id,
      sender: req.user._id,
      type: 'system_announcement',
      title,
      message,
      category: 'system',
      isRead: false
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      data: { sentCount: notifications.length },
      message: 'System announcement sent successfully'
    });
  } catch (error) {
    console.error('Send system announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;