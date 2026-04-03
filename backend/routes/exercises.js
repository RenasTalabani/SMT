const express = require('express');
const Exercise = require('../models/Exercise');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const {
  uploadExerciseImages,
  uploadExerciseVideos,
  handleMulterError
} = require('../middlewares/upload');
const {
  uploadExerciseImage,
  uploadExerciseVideo,
  deleteFromCloudinary
} = require('../services/cloudinary');
const {
  validateExerciseCreation,
  validateObjectId,
  validatePagination
} = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/exercises
// @desc    Get all exercises
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { isActive: true, isApproved: true };

    // Apply filters
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.muscleGroups) {
      filter.muscleGroups = { $in: req.query.muscleGroups.split(',') };
    }
    if (req.query.equipment) {
      filter.equipment = { $in: req.query.equipment.split(',') };
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const exercises = await Exercise.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Exercise.countDocuments(filter);

    res.json({
      success: true,
      data: {
        exercises,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/exercises/categories
// @desc    Get exercise categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Exercise.distinct('category', { isActive: true, isApproved: true });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/exercises/muscle-groups
// @desc    Get muscle groups
// @access  Public
router.get('/muscle-groups', async (req, res) => {
  try {
    const muscleGroups = await Exercise.distinct('muscleGroups', { isActive: true, isApproved: true });

    res.json({
      success: true,
      data: { muscleGroups }
    });
  } catch (error) {
    console.error('Get muscle groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/exercises/:id
// @desc    Get exercise by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id)
      .populate('createdBy', 'name avatar');

    if (!exercise || !exercise.isActive || !exercise.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.json({
      success: true,
      data: { exercise }
    });
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/exercises
// @desc    Create new exercise
// @access  Private/Coach
router.post('/', protect, requireApproval, validateExerciseCreation, async (req, res) => {
  try {
    const exerciseData = {
      ...req.body,
      createdBy: req.user._id,
      isApproved: true  // Auto-approve coach-created exercises
    };

    const exercise = await Exercise.create(exerciseData);

    res.status(201).json({
      success: true,
      data: { exercise },
      message: 'Exercise created successfully'
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/exercises/:id
// @desc    Update exercise
// @access  Private/Coach/Admin
router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Only creator or admin can update
    if (req.user.role !== 'admin' && exercise.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exercise'
      });
    }

    const allowedFields = [
      'name', 'nameAr', 'nameKu', 'description', 'descriptionAr', 'descriptionKu',
      'category', 'muscleGroups', 'equipment', 'difficulty', 'instructions',
      'sets', 'reps', 'restTime', 'tips', 'precautions', 'tags'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedExercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    res.json({
      success: true,
      data: { exercise: updatedExercise },
      message: 'Exercise updated successfully'
    });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/exercises/:id/images
// @desc    Upload exercise images
// @access  Private/Coach/Admin
router.post('/:id/images', protect, validateObjectId, uploadExerciseImages.array('images', 5), handleMulterError, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Only creator or admin can upload images
    if (req.user.role !== 'admin' && exercise.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this exercise'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    // Upload images to Cloudinary
    const uploadPromises = req.files.map(async (file, index) => {
      const imageData = await uploadExerciseImage(file.path, exercise._id);
      return {
        url: imageData.url,
        alt: req.body[`alt_${index}`] || '',
        isPrimary: index === 0 && exercise.images.length === 0 // First image is primary if no images exist
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Add to exercise
    exercise.images.push(...uploadedImages);
    await exercise.save();

    res.json({
      success: true,
      data: { images: uploadedImages },
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Upload exercise images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/exercises/:id/videos
// @desc    Upload exercise videos
// @access  Private/Coach/Admin
router.post('/:id/videos', protect, validateObjectId, uploadExerciseVideos.array('videos', 3), handleMulterError, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Only creator or admin can upload videos
    if (req.user.role !== 'admin' && exercise.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload videos for this exercise'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No video files provided'
      });
    }

    // Upload videos to Cloudinary
    const uploadPromises = req.files.map(async (file, index) => {
      const videoData = await uploadExerciseVideo(file.path, exercise._id);
      return {
        url: videoData.url,
        title: req.body[`title_${index}`] || '',
        duration: req.body[`duration_${index}`] ? parseInt(req.body[`duration_${index}`]) : null,
        thumbnail: videoData.thumbnail || null
      };
    });

    const uploadedVideos = await Promise.all(uploadPromises);

    // Add to exercise
    exercise.videos.push(...uploadedVideos);
    await exercise.save();

    res.json({
      success: true,
      data: { videos: uploadedVideos },
      message: 'Videos uploaded successfully'
    });
  } catch (error) {
    console.error('Upload exercise videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/exercises/:id/approve
// @desc    Approve exercise (admin only)
// @access  Private/Admin
router.put('/:id/approve', protect, authorize('admin'), validateObjectId, async (req, res) => {
  try {
    const { isApproved } = req.body;

    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).populate('createdBy', 'name');

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.json({
      success: true,
      data: { exercise },
      message: `Exercise ${isApproved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Approve exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/exercises/:id
// @desc    Delete exercise
// @access  Private/Coach/Admin
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Only creator or admin can delete
    if (req.user.role !== 'admin' && exercise.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this exercise'
      });
    }

    // Soft delete
    exercise.isActive = false;
    await exercise.save();

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/exercises/:id/similar
// @desc    Get similar exercises
// @access  Public
router.get('/:id/similar', validateObjectId, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Find exercises with same category or muscle groups
    const similarExercises = await Exercise.find({
      _id: { $ne: exercise._id },
      isActive: true,
      isApproved: true,
      $or: [
        { category: exercise.category },
        { muscleGroups: { $in: exercise.muscleGroups } }
      ]
    })
      .limit(6)
      .select('name category muscleGroups difficulty images');

    res.json({
      success: true,
      data: { exercises: similarExercises }
    });
  } catch (error) {
    console.error('Get similar exercises error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;