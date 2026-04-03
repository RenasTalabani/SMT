const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workoutPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  type: {
    type: String,
    required: true,
    enum: ['workout_completion', 'exercise_progress', 'body_measurement', 'weight', 'course_progress', 'goal_achievement']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Workout completion data
  workoutData: {
    workoutId: String, // Reference to workout in plan
    workoutName: String,
    exercises: [{
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      sets: Number,
      reps: Number,
      weight: Number, // in kg
      duration: Number, // in seconds
      completed: {
        type: Boolean,
        default: false
      },
      notes: String
    }],
    duration: Number, // total workout duration in minutes
    caloriesBurned: Number,
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'hard', 'very_hard']
    },
    notes: String
  },
  // Body measurements
  measurements: {
    weight: Number, // in kg
    bodyFat: Number, // in percentage
    muscleMass: Number, // in kg
    bmi: Number,
    chest: Number, // in cm
    waist: Number, // in cm
    hips: Number, // in cm
    biceps: Number, // in cm
    thighs: Number, // in cm
    neck: Number, // in cm
    shoulders: Number, // in cm
    forearms: Number // in cm
  },
  // Course progress
  courseData: {
    week: Number,
    contentId: String,
    completed: {
      type: Boolean,
      default: false
    },
    timeSpent: Number, // in minutes
    quizScore: Number, // if applicable
    notes: String
  },
  // Goal tracking
  goalData: {
    goalType: {
      type: String,
      enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'endurance', 'strength', 'flexibility']
    },
    targetValue: Number,
    currentValue: Number,
    unit: String, // kg, lbs, %, etc.
    deadline: Date,
    achieved: {
      type: Boolean,
      default: false
    }
  },
  // General metrics
  metrics: {
    heartRate: {
      resting: Number,
      max: Number
    },
    sleep: {
      hours: Number,
      quality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent']
      }
    },
    energy: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very_high']
    },
    stress: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very_high']
    },
    mood: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    }
  },
  // Photos for visual progress
  photos: [{
    url: String, // Cloudinary URL
    type: {
      type: String,
      enum: ['front', 'side', 'back', 'progress']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Notes and observations
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  // Coach feedback
  coachFeedback: {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    feedback: {
      type: String,
      maxlength: [500, 'Feedback cannot be more than 500 characters']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    givenAt: {
      type: Date,
      default: Date.now
    }
  },
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: false // Only visible to user and their coach
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
progressSchema.index({ user: 1, date: -1 });
progressSchema.index({ user: 1, type: 1 });
progressSchema.index({ workoutPlan: 1 });
progressSchema.index({ course: 1 });
progressSchema.index({ type: 1, date: -1 });

// Virtual for workout completion percentage
progressSchema.virtual('workoutCompletionPercentage').get(function() {
  if (this.type !== 'workout_completion' || !this.workoutData.exercises.length) return 0;
  const completedExercises = this.workoutData.exercises.filter(ex => ex.completed).length;
  return (completedExercises / this.workoutData.exercises.length) * 100;
});

// Virtual for BMI calculation if not provided
progressSchema.virtual('calculatedBMI').get(function() {
  if (this.measurements.bmi) return this.measurements.bmi;
  if (this.measurements.weight && this.user.height) {
    // BMI = weight (kg) / (height (m))²
    const heightInMeters = this.user.height / 100;
    return this.measurements.weight / (heightInMeters * heightInMeters);
  }
  return null;
});

// Static method to find progress by user and date range
progressSchema.statics.findByUserAndDateRange = function(userId, startDate, endDate, type = null) {
  const query = {
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  };
  if (type) query.type = type;
  return this.find(query).sort({ date: 1 });
};

// Static method to find latest measurements
progressSchema.statics.findLatestMeasurements = function(userId) {
  return this.findOne({
    user: userId,
    type: 'body_measurement'
  }).sort({ date: -1 });
};

// Static method to find workout progress
progressSchema.statics.findWorkoutProgress = function(userId, workoutPlanId = null) {
  const query = { user: userId, type: 'workout_completion' };
  if (workoutPlanId) query.workoutPlan = workoutPlanId;
  return this.find(query).sort({ date: -1 });
};

// Static method to calculate progress statistics
progressSchema.statics.calculateProgressStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgWorkoutDuration: {
          $avg: '$workoutData.duration'
        },
        totalWorkouts: {
          $sum: { $cond: [{ $eq: ['$type', 'workout_completion'] }, 1, 0] }
        },
        avgWeight: {
          $avg: '$measurements.weight'
        },
        weightChange: {
          $push: { date: '$date', weight: '$measurements.weight' }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Progress', progressSchema);