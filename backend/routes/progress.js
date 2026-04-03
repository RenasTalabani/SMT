const express = require('express');
const Progress = require('../models/Progress');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const { protect, authorize } = require('../middlewares/auth');
const {
  uploadProgressPhotos,
  handleMulterError
} = require('../middlewares/upload');
const {
  uploadProgressImage
} = require('../services/cloudinary');
const {
  validateProgressEntry,
  validateObjectId,
  validatePagination
} = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/progress
// @desc    Get user progress
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.workoutPlan) filter.workoutPlan = req.query.workoutPlan;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.date.$lte = new Date(req.query.dateTo);
    }

    const progress = await Progress.find(filter)
      .populate('workoutPlan', 'title level')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Progress.countDocuments(filter);

    res.json({
      success: true,
      data: {
        progress,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/progress/:id
// @desc    Get progress by ID
// @access  Private
router.get('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id)
      .populate('workoutPlan', 'title description level duration')
      .populate('measurements.coach', 'name avatar');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    // Only user or coach can view
    if (req.user.role !== 'admin' &&
        progress.user.toString() !== req.user._id.toString() &&
        req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this progress'
      });
    }

    res.json({
      success: true,
      data: { progress }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/progress
// @desc    Create progress entry
// @access  Private
router.post('/', protect, validateProgressEntry, async (req, res) => {
  try {
    const progressData = {
      ...req.body,
      user: req.user._id
    };

    // If workout plan is specified, verify it exists and user has access
    if (req.body.workoutPlan) {
      const workoutPlan = await WorkoutPlan.findById(req.body.workoutPlan);
      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          message: 'Workout plan not found'
        });
      }

      // Check if user has access to this workout plan
      const hasAccess =
        (workoutPlan.assignedTo && workoutPlan.assignedTo.toString() === req.user._id.toString()) ||
        workoutPlan.createdBy.toString() === req.user._id.toString();

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to log progress for this workout plan'
        });
      }
    }

    const progress = await Progress.create(progressData);

    res.status(201).json({
      success: true,
      data: { progress },
      message: 'Progress logged successfully'
    });
  } catch (error) {
    console.error('Create progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/progress/:id
// @desc    Update progress entry
// @access  Private
router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    // Only user can update their own progress
    if (progress.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this progress'
      });
    }

    const allowedFields = [
      'type', 'workoutPlan', 'date', 'duration', 'caloriesBurned',
      'notes', 'measurements', 'photos', 'mood', 'energyLevel'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProgress = await Progress.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('workoutPlan', 'title level');

    res.json({
      success: true,
      data: { progress: updatedProgress },
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/progress/:id/photos
// @desc    Upload progress photos
// @access  Private
router.post('/:id/photos', protect, validateObjectId, uploadProgressPhotos.array('photos', 10), handleMulterError, async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    // Only user can upload photos for their progress
    if (progress.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload photos for this progress'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No photo files provided'
      });
    }

    const photoUrls = [];

    for (const file of req.files) {
      const photoData = await uploadProgressImage(file.path, progress._id);
      photoUrls.push({
        url: photoData.url,
        publicId: photoData.public_id,
        uploadedAt: new Date()
      });
    }

    // Add to progress photos array
    progress.photos = [...(progress.photos || []), ...photoUrls];
    await progress.save();

    res.json({
      success: true,
      data: { photos: progress.photos },
      message: 'Photos uploaded successfully'
    });
  } catch (error) {
    console.error('Upload progress photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/progress/:id/measurements
// @desc    Add measurements to progress
// @access  Private/Coach
router.post('/:id/measurements', protect, authorize('coach', 'admin'), validateObjectId, async (req, res) => {
  try {
    const { measurements, notes } = req.body;

    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    // Coach can only add measurements for their clients
    if (req.user.role === 'coach') {
      const user = await User.findById(progress.user);
      if (!user || user.coach.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to add measurements for this user'
        });
      }
    }

    const newMeasurements = {
      ...measurements,
      coach: req.user._id,
      measuredAt: new Date(),
      notes: notes || ''
    };

    progress.measurements.push(newMeasurements);
    await progress.save();

    res.status(201).json({
      success: true,
      data: { measurements: progress.measurements },
      message: 'Measurements added successfully'
    });
  } catch (error) {
    console.error('Add measurements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/progress/stats/overview
// @desc    Get progress statistics overview
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const progress = await Progress.find({
      user: userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Calculate statistics
    const stats = {
      totalWorkouts: progress.filter(p => p.type === 'workout').length,
      totalDuration: progress.reduce((sum, p) => sum + (p.duration || 0), 0),
      totalCalories: progress.reduce((sum, p) => sum + (p.caloriesBurned || 0), 0),
      averageMood: progress.length > 0 ?
        progress.reduce((sum, p) => sum + (p.mood || 0), 0) / progress.length : 0,
      averageEnergy: progress.length > 0 ?
        progress.reduce((sum, p) => sum + (p.energyLevel || 0), 0) / progress.length : 0,
      workoutStreak: calculateWorkoutStreak(progress),
      weightChange: calculateWeightChange(progress),
      measurementsCount: progress.reduce((sum, p) => sum + (p.measurements?.length || 0), 0)
    };

    res.json({
      success: true,
      data: { stats, period: parseInt(period) }
    });
  } catch (error) {
    console.error('Get progress stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/progress/stats/chart
// @desc    Get progress chart data
// @access  Private
router.get('/stats/chart', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { metric, period = '90' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let matchCondition = {
      user: userId,
      date: { $gte: startDate }
    };

    let groupBy = {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        }
      }
    };

    switch (metric) {
      case 'weight':
        matchCondition['measurements.weight'] = { $exists: true };
        groupBy.$group.latestMeasurement = { $last: '$measurements' };
        break;
      case 'calories':
        groupBy.$group.total = { $sum: '$caloriesBurned' };
        break;
      case 'duration':
        groupBy.$group.total = { $sum: '$duration' };
        break;
      case 'workouts':
        matchCondition.type = 'workout';
        groupBy.$group.count = { $sum: 1 };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid metric. Use: weight, calories, duration, workouts'
        });
    }

    const chartData = await Progress.aggregate([
      { $match: matchCondition },
      { $unwind: { path: '$measurements', preserveNullAndEmptyArrays: true } },
      groupBy,
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: { chartData, metric, period: parseInt(period) }
    });
  } catch (error) {
    console.error('Get progress chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/progress/:id
// @desc    Delete progress entry
// @access  Private
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    // Only user can delete their own progress
    if (progress.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this progress'
      });
    }

    await Progress.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Progress deleted successfully'
    });
  } catch (error) {
    console.error('Delete progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper functions
function calculateWorkoutStreak(progress) {
  const workoutDays = progress
    .filter(p => p.type === 'workout')
    .map(p => p.date.toDateString())
    .sort();

  if (workoutDays.length === 0) return 0;

  let streak = 1;
  let currentStreak = 1;

  for (let i = 1; i < workoutDays.length; i++) {
    const prevDate = new Date(workoutDays[i - 1]);
    const currDate = new Date(workoutDays[i]);
    const diffTime = currDate - prevDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      streak = Math.max(streak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return streak;
}

function calculateWeightChange(progress) {
  const measurements = progress
    .filter(p => p.measurements && p.measurements.length > 0)
    .sort((a, b) => a.date - b.date);

  if (measurements.length < 2) return 0;

  const firstWeight = measurements[0].measurements[measurements[0].measurements.length - 1]?.weight;
  const lastWeight = measurements[measurements.length - 1].measurements[measurements[measurements.length - 1].measurements.length - 1]?.weight;

  if (!firstWeight || !lastWeight) return 0;

  return lastWeight - firstWeight;
}

module.exports = router;