const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['client', 'coach'])
    .withMessage('Role must be either client or coach'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  handleValidationErrors
];

// Exercise validation rules
const validateExerciseCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Exercise name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['strength', 'cardio', 'flexibility', 'balance', 'sports', 'functional'])
    .withMessage('Invalid category'),
  body('muscleGroups')
    .isArray({ min: 1 })
    .withMessage('At least one muscle group is required'),
  body('muscleGroups.*')
    .isIn(['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'full_body'])
    .withMessage('Invalid muscle group'),
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  handleValidationErrors
];

// Workout plan validation rules
const validateWorkoutPlanCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('category')
    .isIn(['strength', 'cardio', 'mixed', 'weight_loss', 'muscle_gain', 'endurance', 'flexibility'])
    .withMessage('Invalid category'),
  body('duration')
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),
  body('frequency')
    .isInt({ min: 1, max: 7 })
    .withMessage('Frequency must be between 1 and 7 days per week'),
  body('workouts')
    .isArray({ min: 1 })
    .withMessage('At least one workout is required'),
  handleValidationErrors
];

// Course validation rules
const validateCourseCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .isIn(['strength_training', 'cardio', 'yoga', 'pilates', 'crossfit', 'bodybuilding', 'sports_training', 'nutrition', 'flexibility', 'mindfulness'])
    .withMessage('Invalid category'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced', 'all_levels'])
    .withMessage('Invalid level'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('duration')
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),
  body('sessionsPerWeek')
    .isInt({ min: 1, max: 7 })
    .withMessage('Sessions per week must be between 1 and 7'),
  handleValidationErrors
];

// Progress validation rules
const validateProgressEntry = [
  body('type')
    .isIn(['workout_completion', 'exercise_progress', 'body_measurement', 'weight', 'course_progress', 'goal_achievement'])
    .withMessage('Invalid progress type'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  handleValidationErrors
];

// Message validation rules
const validateMessage = [
  body('receiver')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'video', 'file'])
    .withMessage('Invalid message type'),
  handleValidationErrors
];

// Tip validation rules
const validateTipCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters'),
  body('category')
    .isIn(['nutrition', 'training', 'recovery', 'motivation', 'equipment', 'technique', 'lifestyle', 'supplements'])
    .withMessage('Invalid category'),
  body('type')
    .isIn(['tip', 'hack', 'guide', 'article'])
    .withMessage('Invalid type'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordUpdate,
  validateExerciseCreation,
  validateWorkoutPlanCreation,
  validateCourseCreation,
  validateProgressEntry,
  validateMessage,
  validateTipCreation,
  validateObjectId,
  validatePagination
};