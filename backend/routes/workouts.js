const express = require('express');
const WorkoutPlan = require('../models/WorkoutPlan');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const {
  validateWorkoutPlanCreation,
  validateObjectId,
  validatePagination
} = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/workouts
// @desc    Get workout plans
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { isActive: true };

    // Filter based on user role
    if (req.user.role === 'client') {
      // Clients see plans assigned to them
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'coach') {
      // Coaches see plans they created
      filter.$or = [
        { createdBy: req.user._id },
        { isPublic: true, isTemplate: true }
      ];
    } else if (req.user.role === 'admin') {
      // Admins see all plans
    }

    // Apply additional filters
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.isTemplate !== undefined) filter.isTemplate = req.query.isTemplate === 'true';
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const workoutPlans = await WorkoutPlan.find(filter)
      .populate('createdBy', 'name avatar')
      .populate('assignedTo', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WorkoutPlan.countDocuments(filter);

    res.json({
      success: true,
      data: {
        workoutPlans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get workout plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/workouts/templates
// @desc    Get workout plan templates
// @access  Public
router.get('/templates', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {
      isTemplate: true,
      isActive: true,
      isPublic: true
    };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const templates = await WorkoutPlan.find(filter)
      .populate('createdBy', 'name avatar specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WorkoutPlan.countDocuments(filter);

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/workouts/:id
// @desc    Get workout plan by ID
// @access  Private
router.get('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findById(req.params.id)
      .populate('createdBy', 'name avatar specialization')
      .populate('assignedTo', 'name avatar')
      .populate('workouts.exercises.exercise');

    if (!workoutPlan || !workoutPlan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Check permissions
    const canAccess = req.user.role === 'admin' ||
      workoutPlan.createdBy._id.toString() === req.user._id.toString() ||
      workoutPlan.assignedTo?._id.toString() === req.user._id.toString() ||
      (workoutPlan.isTemplate && workoutPlan.isPublic);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this workout plan'
      });
    }

    res.json({
      success: true,
      data: { workoutPlan }
    });
  } catch (error) {
    console.error('Get workout plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/workouts
// @desc    Create workout plan
// @access  Private/Coach
router.post('/', protect, requireApproval, validateWorkoutPlanCreation, async (req, res) => {
  try {
    const workoutPlanData = {
      ...req.body,
      createdBy: req.user._id
    };

    const workoutPlan = await WorkoutPlan.create(workoutPlanData);

    res.status(201).json({
      success: true,
      data: { workoutPlan },
      message: 'Workout plan created successfully'
    });
  } catch (error) {
    console.error('Create workout plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/workouts/:id
// @desc    Update workout plan
// @access  Private/Coach/Admin
router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findById(req.params.id);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Only creator or admin can update
    if (req.user.role !== 'admin' && workoutPlan.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this workout plan'
      });
    }

    const allowedFields = [
      'title', 'titleAr', 'titleKu', 'description', 'descriptionAr', 'descriptionKu',
      'difficulty', 'category', 'duration', 'frequency', 'goals', 'targetAudience',
      'workouts', 'nutrition', 'progressTracking', 'tags', 'isPublic', 'status',
      'startDate', 'endDate'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedWorkoutPlan = await WorkoutPlan.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name avatar')
     .populate('assignedTo', 'name avatar');

    res.json({
      success: true,
      data: { workoutPlan: updatedWorkoutPlan },
      message: 'Workout plan updated successfully'
    });
  } catch (error) {
    console.error('Update workout plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/workouts/:id/assign
// @desc    Assign workout plan to client
// @access  Private/Coach
router.post('/:id/assign', protect, requireApproval, validateObjectId, async (req, res) => {
  try {
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const workoutPlan = await WorkoutPlan.findById(req.params.id);
    const client = await require('../models/User').findById(clientId);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Only creator or admin can assign
    if (req.user.role !== 'admin' && workoutPlan.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign this workout plan'
      });
    }

    // Create a copy of the template for the client
    if (workoutPlan.isTemplate) {
      const clientWorkoutPlan = await WorkoutPlan.create({
        title: workoutPlan.title,
        description: workoutPlan.description,
        createdBy: req.user._id,
        assignedTo: clientId,
        isTemplate: false,
        difficulty: workoutPlan.difficulty,
        category: workoutPlan.category,
        duration: workoutPlan.duration,
        frequency: workoutPlan.frequency,
        goals: workoutPlan.goals,
        targetAudience: workoutPlan.targetAudience,
        workouts: workoutPlan.workouts,
        nutrition: workoutPlan.nutrition,
        progressTracking: workoutPlan.progressTracking,
        startDate: new Date(),
        status: 'active'
      });

      return res.json({
        success: true,
        data: { workoutPlan: clientWorkoutPlan },
        message: 'Workout plan assigned to client successfully'
      });
    } else {
      // Assign existing plan
      workoutPlan.assignedTo = clientId;
      workoutPlan.status = 'active';
      workoutPlan.startDate = new Date();
      await workoutPlan.save();

      res.json({
        success: true,
        data: { workoutPlan },
        message: 'Workout plan assigned to client successfully'
      });
    }
  } catch (error) {
    console.error('Assign workout plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/workouts/:id/progress
// @desc    Update workout progress
// @access  Private/Client
router.put('/:id/progress', protect, validateObjectId, async (req, res) => {
  try {
    const { workoutIndex, exerciseIndex, completed, sets, reps, weight, notes } = req.body;

    const workoutPlan = await WorkoutPlan.findById(req.params.id);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Only assigned client can update progress
    if (workoutPlan.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this workout plan progress'
      });
    }

    // Update exercise progress
    if (workoutPlan.workouts[workoutIndex] && workoutPlan.workouts[workoutIndex].exercises[exerciseIndex]) {
      const exercise = workoutPlan.workouts[workoutIndex].exercises[exerciseIndex];

      if (completed !== undefined) exercise.completed = completed;
      if (sets !== undefined) exercise.sets = sets;
      if (reps !== undefined) exercise.reps = reps;
      if (weight !== undefined) exercise.weight = weight;
      if (notes !== undefined) exercise.notes = notes;
    }

    await workoutPlan.save();

    res.json({
      success: true,
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

// @route   DELETE /api/workouts/:id
// @desc    Delete workout plan
// @access  Private/Coach/Admin
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findById(req.params.id);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Only creator or admin can delete
    if (req.user.role !== 'admin' && workoutPlan.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this workout plan'
      });
    }

    // Soft delete
    workoutPlan.isActive = false;
    await workoutPlan.save();

    res.json({
      success: true,
      message: 'Workout plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete workout plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/workouts/:id/progress
// @desc    Get workout progress
// @access  Private/Client/Coach
router.get('/:id/progress', protect, validateObjectId, async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findById(req.params.id);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Check permissions
    const canAccess = req.user.role === 'admin' ||
      workoutPlan.createdBy._id.toString() === req.user._id.toString() ||
      workoutPlan.assignedTo?._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this workout plan progress'
      });
    }

    // Calculate progress statistics
    let totalExercises = 0;
    let completedExercises = 0;

    workoutPlan.workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        totalExercises++;
        if (exercise.completed) completedExercises++;
      });
    });

    const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalExercises,
        completedExercises,
        progressPercentage,
        workouts: workoutPlan.workouts
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

// @route   POST /api/workouts/request
// @desc    Client requests a custom plan from a coach
// @access  Private/Client
router.post('/request', protect, authorize('client'), async (req, res) => {
  try {
    const { coachId, planType, notes } = req.body;

    if (!coachId || !planType) {
      return res.status(400).json({
        success: false,
        message: 'Coach and plan type are required'
      });
    }

    const User = require('../models/User');
    const Notification = require('../models/Notification');

    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach' || !coach.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    await Notification.create({
      recipient: coachId,
      sender: req.user._id,
      type: 'plan_request',
      title: 'New Plan Request',
      message: `${req.user.name} is requesting a ${planType} plan.${notes ? ' Notes: ' + notes : ''}`,
      category: 'workout',
      priority: 'high',
      data: {
        customData: {
          planType,
          notes: notes || '',
          clientId: req.user._id.toString(),
          clientName: req.user.name
        }
      }
    });

    res.json({
      success: true,
      message: 'Plan request sent to coach successfully'
    });
  } catch (error) {
    console.error('Plan request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;