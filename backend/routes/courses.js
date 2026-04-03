const express = require('express');
const Course = require('../models/Course');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const {
  uploadCourseMaterials,
  handleMulterError
} = require('../middlewares/upload');
const {
  uploadCourseThumbnail,
  uploadCourseVideo
} = require('../services/cloudinary');
const {
  validateCourseCreation,
  validateObjectId,
  validatePagination
} = require('../middlewares/validation');
const { sendCourseEnrollmentConfirmation } = require('../services/email');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get courses
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { isPublished: true, isActive: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.instructor) filter.instructor = req.query.instructor;
    if (req.query.priceMin || req.query.priceMax) {
      filter.price = {};
      if (req.query.priceMin) filter.price.$gte = parseFloat(req.query.priceMin);
      if (req.query.priceMax) filter.price.$lte = parseFloat(req.query.priceMax);
    }
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const courses = await Course.find(filter)
      .populate('instructor', 'name avatar specialization rating reviewCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/courses/categories
// @desc    Get course categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', { isPublished: true, isActive: true });

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

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio specialization certifications rating reviewCount')
      .populate('enrolledStudents.student', 'name avatar');

    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Don't show full content if not published
    if (!course.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/courses
// @desc    Create course
// @access  Private/Coach
router.post('/', protect, requireApproval, validateCourseCreation, async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user._id
    };

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      data: { course },
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private/Coach/Admin
router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Only instructor or admin can update
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    const allowedFields = [
      'title', 'titleAr', 'titleKu', 'description', 'descriptionAr', 'descriptionKu',
      'category', 'level', 'duration', 'sessionsPerWeek', 'price', 'thumbnail',
      'trailerVideo', 'content', 'prerequisites', 'learningObjectives', 'tags',
      'maxStudents', 'startDate', 'endDate', 'language'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('instructor', 'name avatar');

    res.json({
      success: true,
      data: { course: updatedCourse },
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/courses/:id/thumbnail
// @desc    Upload course thumbnail
// @access  Private/Coach/Admin
router.post('/:id/thumbnail', protect, validateObjectId, uploadCourseMaterials.single('thumbnail'), handleMulterError, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Only instructor or admin can upload
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload thumbnail for this course'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No thumbnail file provided'
      });
    }

    // Upload to Cloudinary
    const thumbnailData = await uploadCourseThumbnail(req.file.path, course._id);

    // Update course
    course.thumbnail = thumbnailData.url;
    await course.save();

    res.json({
      success: true,
      data: { thumbnail: course.thumbnail },
      message: 'Thumbnail uploaded successfully'
    });
  } catch (error) {
    console.error('Upload thumbnail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in course
// @access  Private/Client
router.post('/:id/enroll', protect, validateObjectId, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course || !course.isPublished || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = course.enrolledStudents.some(
      enrollment => enrollment.student.toString() === req.user._id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Check max students limit
    if (course.maxStudents && course.enrollmentCount >= course.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Course is full'
      });
    }

    // Add student to course
    course.enrolledStudents.push({
      student: req.user._id,
      enrolledAt: new Date()
    });

    await course.save();

    // Send confirmation email
    try {
      await sendCourseEnrollmentConfirmation(req.user, course);
    } catch (emailError) {
      console.error('Enrollment confirmation email error:', emailError);
      // Don't fail enrollment if email fails
    }

    res.json({
      success: true,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/courses/:id/progress
// @desc    Update course progress
// @access  Private/Client
router.put('/:id/progress', protect, validateObjectId, async (req, res) => {
  try {
    const { week, contentId, completed } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find student's enrollment
    const enrollment = course.enrolledStudents.find(
      e => e.student.toString() === req.user._id.toString()
    );

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Update progress
    enrollment.progress = completed ? 100 : Math.max(enrollment.progress, 50); // Assume 50% if marked as completed

    if (completed && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      enrollment.certificateIssued = true;
    }

    await course.save();

    res.json({
      success: true,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Update course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/courses/:id/my-progress
// @desc    Get my course progress
// @access  Private/Client
router.get('/:id/my-progress', protect, validateObjectId, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find student's enrollment
    const enrollment = course.enrolledStudents.find(
      e => e.student.toString() === req.user._id.toString()
    );

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          instructor: course.instructor,
          duration: course.duration,
          content: course.content
        },
        enrollment: {
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress,
          completedAt: enrollment.completedAt,
          certificateIssued: enrollment.certificateIssued
        }
      }
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/courses/:id/publish
// @desc    Publish/unpublish course
// @access  Private/Coach/Admin
router.put('/:id/publish', protect, validateObjectId, async (req, res) => {
  try {
    const { isPublished } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Only instructor or admin can publish
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this course'
      });
    }

    course.isPublished = isPublished;
    if (isPublished) {
      course.publishedAt = new Date();
    }
    await course.save();

    res.json({
      success: true,
      message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private/Coach/Admin
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Only instructor or admin can delete
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    // Soft delete
    course.isActive = false;
    await course.save();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/courses/instructor/:instructorId
// @desc    Get courses by instructor
// @access  Public
router.get('/instructor/:instructorId', validateObjectId, async (req, res) => {
  try {
    const courses = await Course.find({
      instructor: req.params.instructorId,
      isPublished: true,
      isActive: true
    })
      .select('title description category level price thumbnail rating enrollmentCount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;