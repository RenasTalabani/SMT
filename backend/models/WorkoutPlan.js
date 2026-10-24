const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  titleAr: {
    type: String,
    trim: true,
    maxlength: [100, 'Arabic title cannot be more than 100 characters']
  },
  titleKu: {
    type: String,
    trim: true,
    maxlength: [100, 'Kurdish title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  descriptionAr: {
    type: String,
    maxlength: [1000, 'Arabic description cannot be more than 1000 characters']
  },
  descriptionKu: {
    type: String,
    maxlength: [1000, 'Kurdish description cannot be more than 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isTemplate: {
    type: Boolean,
    default: false // If true, it's a reusable template
  },
  isPublic: {
    type: Boolean,
    default: false // If true, other coaches can see it
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'mixed', 'weight_loss', 'muscle_gain', 'endurance', 'flexibility'],
    default: 'mixed'
  },
  duration: {
    type: Number, // in weeks
    min: [1, 'Duration must be at least 1 week'],
    max: [52, 'Duration cannot be more than 52 weeks']
  },
  frequency: {
    type: Number, // days per week
    min: [1, 'Frequency must be at least 1 day per week'],
    max: [7, 'Frequency cannot be more than 7 days per week']
  },
  goals: [{
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness', 'strength', 'conditioning']
  }],
  targetAudience: {
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    ageRange: {
      min: {
        type: Number,
        min: [13, 'Minimum age must be at least 13']
      },
      max: {
        type: Number,
        max: [100, 'Maximum age cannot be more than 100']
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'all']
    }
  },
  workouts: [{
    day: {
      type: Number,
      required: true,
      min: [1, 'Day must be at least 1'],
      max: [7, 'Day cannot be more than 7']
    },
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Workout name cannot be more than 100 characters']
    },
    nameAr: {
      type: String,
      maxlength: [100, 'Arabic workout name cannot be more than 100 characters']
    },
    nameKu: {
      type: String,
      maxlength: [100, 'Kurdish workout name cannot be more than 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Workout description cannot be more than 500 characters']
    },
    estimatedDuration: {
      type: Number, // in minutes
      min: [5, 'Duration must be at least 5 minutes'],
      max: [180, 'Duration cannot be more than 3 hours']
    },
    exercises: [{
      // Link to the exercise library. Optional so AI-generated / free-text
      // exercises can be saved; then `name` carries the exercise name.
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: function () { return !this.name; }
      },
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Exercise name cannot be more than 100 characters']
      },
      sets: {
        type: Number,
        required: true,
        min: [1, 'Sets must be at least 1'],
        max: [10, 'Sets cannot be more than 10']
      },
      reps: {
        type: Number,
        min: [1, 'Reps must be at least 1'],
        max: [100, 'Reps cannot be more than 100']
      },
      weight: {
        type: Number, // in kg
        min: [0, 'Weight cannot be negative']
      },
      duration: {
        type: Number, // in seconds (for timed exercises)
        min: [1, 'Duration must be at least 1 second']
      },
      restTime: {
        type: Number, // in seconds
        min: [0, 'Rest time cannot be negative'],
        max: [600, 'Rest time cannot be more than 10 minutes']
      },
      notes: {
        type: String,
        maxlength: [200, 'Notes cannot be more than 200 characters']
      },
      order: {
        type: Number,
        default: 0
      },
      completed: {
        type: Boolean,
        default: false
      }
    }],
    warmUp: {
      type: String,
      maxlength: [500, 'Warm-up cannot be more than 500 characters']
    },
    coolDown: {
      type: String,
      maxlength: [500, 'Cool-down cannot be more than 500 characters']
    }
  }],
  nutrition: {
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative']
    },
    protein: {
      type: Number, // in grams
      min: [0, 'Protein cannot be negative']
    },
    carbs: {
      type: Number, // in grams
      min: [0, 'Carbs cannot be negative']
    },
    fats: {
      type: Number, // in grams
      min: [0, 'Fats cannot be negative']
    },
    guidelines: {
      type: String,
      maxlength: [1000, 'Guidelines cannot be more than 1000 characters']
    }
  },
  progressTracking: {
    enabled: {
      type: Boolean,
      default: true
    },
    metrics: [{
      type: String,
      enum: ['weight', 'body_fat', 'muscle_mass', 'measurements', 'strength', 'endurance']
    }]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      min: [0, 'Average rating cannot be less than 0'],
      max: [5, 'Average rating cannot be more than 5'],
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'paused'],
    default: 'draft'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
workoutPlanSchema.index({ createdBy: 1 });
workoutPlanSchema.index({ assignedTo: 1 });
workoutPlanSchema.index({ isTemplate: 1 });
workoutPlanSchema.index({ isPublic: 1 });
workoutPlanSchema.index({ category: 1 });
workoutPlanSchema.index({ difficulty: 1 });
workoutPlanSchema.index({ status: 1 });

// Virtual for total workouts
workoutPlanSchema.virtual('totalWorkouts').get(function() {
  return this.workouts.length;
});

// Virtual for estimated completion date
workoutPlanSchema.virtual('estimatedCompletionDate').get(function() {
  if (!this.startDate || !this.duration) return null;
  const completionDate = new Date(this.startDate);
  completionDate.setDate(completionDate.getDate() + (this.duration * 7));
  return completionDate;
});

// Static method to find templates
workoutPlanSchema.statics.findTemplates = function(filters = {}) {
  const query = { isTemplate: true, isActive: true };
  if (filters.category) query.category = filters.category;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.createdBy) query.createdBy = filters.createdBy;
  return this.find(query);
};

// Static method to find plans by user
workoutPlanSchema.statics.findByUser = function(userId, role = 'client') {
  if (role === 'coach') {
    return this.find({ createdBy: userId });
  } else {
    return this.find({ assignedTo: userId });
  }
};

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);