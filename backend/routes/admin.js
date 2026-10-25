const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Tip = require('../models/Tip');
const WorkoutPlan = require('../models/WorkoutPlan');
const Progress = require('../models/Progress');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middlewares/auth');
const { validateObjectId, validatePagination } = require('../middlewares/validation');

const router = express.Router();

// All routes require admin access
router.use(protect, authorize('admin'));

// @route   GET /api/admin/dashboard/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalCoaches,
      totalClients,
      totalCourses,
      totalTips,
      totalWorkoutPlans,
      totalMessages,
      totalNotifications,
      recentUsers,
      recentCourses,
      recentTips
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'coach' }),
      User.countDocuments({ role: 'client' }),
      Course.countDocuments({ isActive: true }),
      Tip.countDocuments({ isActive: true }),
      WorkoutPlan.countDocuments({ isActive: true }),
      Message.countDocuments(),
      Notification.countDocuments(),
      User.find()
        .select('name email role createdAt isApproved')
        .sort({ createdAt: -1 })
        .limit(5),
      Course.find({ isActive: true })
        .select('title instructor createdAt isPublished')
        .populate('instructor', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Tip.find({ isActive: true })
        .select('title author createdAt isPublished')
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calculate growth metrics (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      usersLast30Days,
      usersPrevious30Days,
      coursesLast30Days,
      coursesPrevious30Days
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      Course.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, isActive: true }),
      Course.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, isActive: true })
    ]);

    const userGrowth = usersPrevious30Days > 0 ?
      ((usersLast30Days - usersPrevious30Days) / usersPrevious30Days * 100).toFixed(1) : 0;

    const courseGrowth = coursesPrevious30Days > 0 ?
      ((coursesLast30Days - coursesPrevious30Days) / coursesPrevious30Days * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCoaches,
          totalClients,
          totalCourses,
          totalTips,
          totalWorkoutPlans,
          totalMessages,
          totalNotifications
        },
        growth: {
          userGrowth: parseFloat(userGrowth),
          courseGrowth: parseFloat(courseGrowth)
        },
        recent: {
          users: recentUsers,
          courses: recentCourses,
          tips: recentTips
        }
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private/Admin
router.get('/users', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.role) filter.role = req.query.role;
    if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('coach', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve or reject user
// @access  Private/Admin
router.put('/users/:id/approve', validateObjectId, async (req, res) => {
  try {
    const { isApproved, rejectionReason } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isApproved = isApproved;
    if (!isApproved && rejectionReason) {
      user.rejectionReason = rejectionReason;
    }

    await user.save();

    // Send notification
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: isApproved ? 'account_approved' : 'account_rejected',
      title: isApproved ? 'Account Approved' : 'Account Rejected',
      message: isApproved ?
        'Your account has been approved. You can now access all features.' :
        `Your account registration was rejected. Reason: ${rejectionReason || 'Not specified'}`,
      actionUrl: '/profile'
    });

    res.json({
      success: true,
      message: `User ${isApproved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Private/Admin
router.put('/users/:id/role', validateObjectId, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['client', 'coach', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Send notification
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: 'role_changed',
      title: 'Role Updated',
      message: `Your role has been changed from ${oldRole} to ${role}`,
      actionUrl: '/profile'
    });

    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/deactivate user
// @access  Private/Admin
router.put('/users/:id/status', validateObjectId, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    // Send notification
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: isActive ? 'account_activated' : 'account_deactivated',
      title: isActive ? 'Account Activated' : 'Account Deactivated',
      message: `Your account has been ${isActive ? 'activated' : 'deactivated'}`,
      actionUrl: '/profile'
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Change user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/content
// @desc    Get all content (courses, tips, workout plans)
// @access  Private/Admin
router.get('/content', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { type, status, search } = req.query;

    let Model;
    let populateField;

    switch (type) {
      case 'courses':
        Model = Course;
        populateField = 'instructor';
        break;
      case 'tips':
        Model = Tip;
        populateField = 'author';
        break;
      case 'workouts':
        Model = WorkoutPlan;
        populateField = 'createdBy';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid content type. Use: courses, tips, workouts'
        });
    }

    const filter = { isActive: true };

    if (status === 'published') filter.isPublished = true;
    else if (status === 'draft') filter.isPublished = false;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const content = await Model.find(filter)
      .populate(populateField, 'name email')
      .select('title description isPublished createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Model.countDocuments(filter);

    res.json({
      success: true,
      data: {
        content,
        type,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/content/:type/:id/publish
// @desc    Publish/unpublish content
// @access  Private/Admin
router.put('/content/:type/:id/publish', validateObjectId, async (req, res) => {
  try {
    const { type } = req.params;
    const { isPublished } = req.body;

    let Model;
    let contentType;

    switch (type) {
      case 'courses':
        Model = Course;
        contentType = 'course';
        break;
      case 'tips':
        Model = Tip;
        contentType = 'tip';
        break;
      case 'workouts':
        Model = WorkoutPlan;
        contentType = 'workout plan';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
    }

    const content = await Model.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${contentType} not found`
      });
    }

    content.isPublished = isPublished;
    if (isPublished) {
      content.publishedAt = new Date();
    }
    await content.save();

    res.json({
      success: true,
      message: `${contentType} ${isPublished ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    console.error('Publish content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/content/:type/:id
// @desc    Delete content
// @access  Private/Admin
router.delete('/content/:type/:id', validateObjectId, async (req, res) => {
  try {
    const { type } = req.params;

    let Model;
    let contentType;

    switch (type) {
      case 'courses':
        Model = Course;
        contentType = 'course';
        break;
      case 'tips':
        Model = Tip;
        contentType = 'tip';
        break;
      case 'workouts':
        Model = WorkoutPlan;
        contentType = 'workout plan';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
    }

    const content = await Model.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${contentType} not found`
      });
    }

    // Soft delete
    content.isActive = false;
    await content.save();

    res.json({
      success: true,
      message: `${contentType} deleted successfully`
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      userRegistrations,
      courseEnrollments,
      workoutCompletions,
      tipViews,
      messageCount,
      progressEntries
    ] = await Promise.all([
      // User registrations over time
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Course enrollments over time
      Course.aggregate([
        { $unwind: '$enrolledStudents' },
        { $match: { 'enrolledStudents.enrolledAt': { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$enrolledStudents.enrolledAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Workout completions
      Progress.aggregate([
        { $match: { type: 'workout', date: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Tip views
      Tip.aggregate([
        { $match: { updatedAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$views' }
          }
        }
      ]),

      // Messages count
      Message.countDocuments({ createdAt: { $gte: startDate } }),

      // Progress entries
      Progress.countDocuments({ date: { $gte: startDate } })
    ]);

    res.json({
      success: true,
      data: {
        userRegistrations,
        courseEnrollments,
        workoutCompletions,
        tipViews: tipViews[0]?.totalViews || 0,
        messageCount,
        progressEntries,
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics/users
// @desc    Get user analytics data
// @access  Private/Admin
router.get('/analytics/users', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByRole,
      userGrowth
    ] = await Promise.all([
      // Total users
      User.countDocuments({ isActive: true }),

      // Active users (logged in within last 7 days)
      User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        isActive: true
      }),

      // New users today
      User.countDocuments({
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
        isActive: true
      }),

      // New users this week
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        isActive: true
      }),

      // New users this month
      User.countDocuments({
        createdAt: { $gte: startDate },
        isActive: true
      }),

      // Users by role
      User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),

      // User growth over time
      User.aggregate([
        { $match: { createdAt: { $gte: startDate }, isActive: true } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          newUsersToday,
          newUsersThisWeek,
          newUsersThisMonth
        },
        distribution: {
          byRole: usersByRole
        },
        growth: userGrowth,
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics/courses
// @desc    Get course analytics data
// @access  Private/Admin
router.get('/analytics/courses', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalCourses,
      publishedCourses,
      totalEnrollments,
      courseEnrollments,
      coursesByCategory,
      coursesByLevel,
      averageRating,
      completionRate
    ] = await Promise.all([
      // Total courses
      Course.countDocuments({ isActive: true }),

      // Published courses
      Course.countDocuments({ isActive: true, isPublished: true }),

      // Total enrollments
      Course.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $size: { $ifNull: ['$enrolledStudents', []] } } } } }
      ]),

      // Course enrollments over time
      Course.aggregate([
        { $unwind: '$enrolledStudents' },
        { $match: { 'enrolledStudents.enrolledAt': { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$enrolledStudents.enrolledAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Courses by category
      Course.aggregate([
        { $match: { isActive: true, isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),

      // Courses by level
      Course.aggregate([
        { $match: { isActive: true, isPublished: true } },
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]),

      // Average rating
      Course.aggregate([
        { $match: { isActive: true, isPublished: true, 'ratings.0': { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$averageRating' } } }
      ]),

      // Completion rate
      Course.aggregate([
        {
          $match: {
            isActive: true,
            'enrolledStudents.0': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            totalEnrolled: { $sum: { $size: { $ifNull: ['$enrolledStudents', []] } } },
            totalCompleted: {
              $sum: {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$enrolledStudents', []] },
                    // completed = has a completedAt date
                    cond: { $ne: [{ $ifNull: ['$$this.completedAt', null] }, null] }
                  }
                }
              }
            }
          }
        }
      ])
    ]);

    const completionRateValue = completionRate[0] ?
      ((completionRate[0].totalCompleted / completionRate[0].totalEnrolled) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalCourses,
          publishedCourses,
          totalEnrollments: totalEnrollments[0]?.total || 0,
          averageRating: averageRating[0]?.avgRating?.toFixed(1) || 0,
          completionRate: parseFloat(completionRateValue)
        },
        distribution: {
          byCategory: coursesByCategory,
          byLevel: coursesByLevel
        },
        growth: courseEnrollments,
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics/tips
// @desc    Get tips analytics data
// @access  Private/Admin
router.get('/analytics/tips', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalTips,
      publishedTips,
      totalViews,
      totalLikes,
      totalComments,
      tipsByCategory,
      tipsByType,
      engagementOverTime,
      topTips
    ] = await Promise.all([
      // Total tips
      Tip.countDocuments({ isActive: true }),

      // Published tips
      Tip.countDocuments({ isActive: true, isPublished: true }),

      // Total views
      Tip.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),

      // Total likes
      Tip.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$likesCount' } } }
      ]),

      // Total comments
      Tip.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$commentsCount' } } }
      ]),

      // Tips by category
      Tip.aggregate([
        { $match: { isActive: true, isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),

      // Tips by type
      Tip.aggregate([
        { $match: { isActive: true, isPublished: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),

      // Engagement over time (likes + comments)
      Tip.aggregate([
        { $match: { updatedAt: { $gte: startDate }, isActive: true } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' }
            },
            likes: { $sum: '$likesCount' },
            comments: { $sum: '$commentsCount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Top tips by engagement
      Tip.find({ isActive: true, isPublished: true })
        .select('title views likesCount commentsCount')
        .sort({ likesCount: -1, commentsCount: -1, views: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalTips,
          publishedTips,
          totalViews: totalViews[0]?.total || 0,
          totalLikes: totalLikes[0]?.total || 0,
          totalComments: totalComments[0]?.total || 0
        },
        distribution: {
          byCategory: tipsByCategory,
          byType: tipsByType
        },
        engagement: engagementOverTime,
        topTips,
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Get tips analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics/workouts
// @desc    Get workout analytics data
// @access  Private/Admin
router.get('/analytics/workouts', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalWorkouts,
      publishedWorkouts,
      totalAssignments,
      workoutCompletions,
      workoutsByCategory,
      workoutsByDifficulty,
      completionRate,
      averageCompletionTime
    ] = await Promise.all([
      // Total workout plans
      WorkoutPlan.countDocuments({ isActive: true }),

      // Published workout plans
      WorkoutPlan.countDocuments({ isActive: true, isPublished: true }),

      // Total assignments
      WorkoutPlan.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: {
          $sum: {
            // assignedTo is one member (ObjectId) in the schema; older data may hold a list.
            $cond: [
              { $isArray: '$assignedTo' },
              { $size: '$assignedTo' },
              { $cond: [{ $ifNull: ['$assignedTo', false] }, 1, 0] },
            ],
          },
        } } }
      ]),

      // Workout completions over time
      Progress.aggregate([
        { $match: { type: 'workout', date: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Workouts by category
      WorkoutPlan.aggregate([
        { $match: { isActive: true, isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),

      // Workouts by difficulty
      WorkoutPlan.aggregate([
        { $match: { isActive: true, isPublished: true } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } }
      ]),

      // Completion rate
      Progress.aggregate([
        { $match: { type: 'workout', date: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalCompleted: { $sum: 1 },
            totalAssigned: { $sum: 1 } // This is approximate
          }
        }
      ]),

      // Average completion time (in minutes)
      Progress.aggregate([
        { $match: { type: 'workout', date: { $gte: startDate }, duration: { $exists: true } } },
        { $group: { _id: null, avgTime: { $avg: '$duration' } } }
      ])
    ]);

    const completionRateValue = completionRate[0] ?
      ((completionRate[0].totalCompleted / Math.max(completionRate[0].totalAssigned, 1)) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalWorkouts,
          publishedWorkouts,
          totalAssignments: totalAssignments[0]?.total || 0,
          completionRate: parseFloat(completionRateValue),
          averageCompletionTime: averageCompletionTime[0]?.avgTime?.toFixed(1) || 0
        },
        distribution: {
          byCategory: workoutsByCategory,
          byDifficulty: workoutsByDifficulty
        },
        growth: workoutCompletions,
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Get workout analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics/revenue
// @desc    Get revenue analytics data
// @access  Private/Admin
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // For now, we'll track course purchases as revenue
    // In a real app, you'd have a separate revenue/payments model
    const [
      totalRevenue,
      courseRevenue,
      revenueByCategory,
      revenueOverTime,
      topCourses
    ] = await Promise.all([
      // Total revenue (simulated - course enrollments * price)
      Course.aggregate([
        { $match: { isActive: true, price: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: { $multiply: ['$price', { $size: { $ifNull: ['$enrolledStudents', []] } }] }
            }
          }
        }
      ]),

      // Revenue by course
      Course.aggregate([
        { $match: { isActive: true, price: { $gt: 0 } } },
        {
          $project: {
            title: 1,
            price: 1,
            enrollmentCount: { $size: { $ifNull: ['$enrolledStudents', []] } },
            revenue: { $multiply: ['$price', { $size: { $ifNull: ['$enrolledStudents', []] } }] }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),

      // Revenue by category
      Course.aggregate([
        { $match: { isActive: true, price: { $gt: 0 } } },
        {
          $group: {
            _id: '$category',
            revenue: {
              $sum: { $multiply: ['$price', { $size: { $ifNull: ['$enrolledStudents', []] } }] }
            }
          }
        }
      ]),

      // Revenue over time
      Course.aggregate([
        { $unwind: '$enrolledStudents' },
        { $match: { 'enrolledStudents.enrolledAt': { $gte: startDate }, price: { $gt: 0 } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$enrolledStudents.enrolledAt' }
            },
            revenue: { $sum: '$price' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Top revenue-generating courses
      Course.find({ isActive: true, price: { $gt: 0 } })
        .select('title price enrollmentCount')
        .sort({ price: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: totalRevenue[0]?.revenue?.toFixed(2) || 0,
          courseRevenue: totalRevenue[0]?.revenue?.toFixed(2) || 0
        },
        distribution: {
          byCategory: revenueByCategory
        },
        growth: revenueOverTime,
        topCourses: courseRevenue,
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/system-announcement
// @desc    Send system-wide announcement
// @access  Private/Admin
router.post('/system-announcement', async (req, res) => {
  try {
    const { title, message, targetRoles = ['client', 'coach', 'admin'] } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const recipients = await User.find({
      role: { $in: targetRoles },
      isActive: true
    }).select('_id');

    const notifications = recipients.map(recipient => ({
      recipient: recipient._id,
      sender: req.user._id,
      type: 'system_announcement',
      title,
      message,
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