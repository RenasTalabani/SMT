const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  nameAr: {
    type: String,
    trim: true,
    maxlength: [100, 'Arabic name cannot be more than 100 characters']
  },
  nameKu: {
    type: String,
    trim: true,
    maxlength: [100, 'Kurdish name cannot be more than 100 characters']
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
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['strength', 'cardio', 'flexibility', 'balance', 'sports', 'functional']
  },
  muscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'full_body'],
    required: true
  }],
  equipment: [{
    type: String,
    enum: ['none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'pull_up_bar', 'bench', 'cable_machine', 'treadmill', 'bike', 'elliptical', 'rowing_machine', 'other'],
    default: ['none']
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  instructions: [{
    step: {
      type: Number,
      required: true
    },
    instruction: {
      type: String,
      required: true,
      maxlength: [500, 'Instruction cannot be more than 500 characters']
    },
    instructionAr: {
      type: String,
      maxlength: [500, 'Arabic instruction cannot be more than 500 characters']
    },
    instructionKu: {
      type: String,
      maxlength: [500, 'Kurdish instruction cannot be more than 500 characters']
    }
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  videos: [{
    url: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    duration: {
      type: Number, // in seconds
      min: [1, 'Duration must be at least 1 second']
    },
    thumbnail: {
      type: String
    }
  }],
  caloriesBurned: {
    type: Number,
    min: [0, 'Calories burned cannot be negative']
  },
  duration: {
    type: Number, // in minutes
    min: [1, 'Duration must be at least 1 minute']
  },
  sets: {
    recommended: {
      type: Number,
      min: [1, 'Recommended sets must be at least 1'],
      max: [10, 'Recommended sets cannot be more than 10']
    },
    range: {
      min: {
        type: Number,
        min: [1, 'Minimum sets must be at least 1']
      },
      max: {
        type: Number,
        max: [20, 'Maximum sets cannot be more than 20']
      }
    }
  },
  reps: {
    recommended: {
      type: Number,
      min: [1, 'Recommended reps must be at least 1']
    },
    range: {
      min: {
        type: Number,
        min: [1, 'Minimum reps must be at least 1']
      },
      max: {
        type: Number,
        max: [100, 'Maximum reps cannot be more than 100']
      }
    }
  },
  restTime: {
    type: Number, // in seconds
    min: [0, 'Rest time cannot be negative'],
    max: [600, 'Rest time cannot be more than 10 minutes']
  },
  tips: [{
    tip: {
      type: String,
      maxlength: [300, 'Tip cannot be more than 300 characters']
    },
    tipAr: {
      type: String,
      maxlength: [300, 'Arabic tip cannot be more than 300 characters']
    },
    tipKu: {
      type: String,
      maxlength: [300, 'Kurdish tip cannot be more than 300 characters']
    }
  }],
  precautions: [{
    precaution: {
      type: String,
      maxlength: [300, 'Precaution cannot be more than 300 characters']
    },
    precautionAr: {
      type: String,
      maxlength: [300, 'Arabic precaution cannot be more than 300 characters']
    },
    precautionKu: {
      type: String,
      maxlength: [300, 'Kurdish precaution cannot be more than 300 characters']
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false // Admin approval required
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ isApproved: 1 });
exerciseSchema.index({ isActive: 1 });
exerciseSchema.index({ tags: 1 });

// Virtual for primary image
exerciseSchema.virtual('primaryImage').get(function() {
  return this.images.find(img => img.isPrimary) || this.images[0];
});

// Virtual for primary video
exerciseSchema.virtual('primaryVideo').get(function() {
  return this.videos[0];
});

// Static method to find exercises by muscle group
exerciseSchema.statics.findByMuscleGroup = function(muscleGroup) {
  return this.find({
    muscleGroups: muscleGroup,
    isActive: true,
    isApproved: true
  });
};

// Static method to find exercises by category
exerciseSchema.statics.findByCategory = function(category) {
  return this.find({
    category,
    isActive: true,
    isApproved: true
  });
};

module.exports = mongoose.model('Exercise', exerciseSchema);