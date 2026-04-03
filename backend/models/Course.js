const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
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
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  descriptionAr: {
    type: String,
    maxlength: [2000, 'Arabic description cannot be more than 2000 characters']
  },
  descriptionKu: {
    type: String,
    maxlength: [2000, 'Kurdish description cannot be more than 2000 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['strength_training', 'cardio', 'yoga', 'pilates', 'crossfit', 'bodybuilding', 'sports_training', 'nutrition', 'flexibility', 'mindfulness']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all_levels'],
    default: 'all_levels'
  },
  duration: {
    type: Number, // in weeks
    min: [1, 'Duration must be at least 1 week'],
    max: [52, 'Duration cannot be more than 52 weeks']
  },
  sessionsPerWeek: {
    type: Number,
    min: [1, 'Sessions per week must be at least 1'],
    max: [7, 'Sessions per week cannot be more than 7']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'IQD', 'TRY']
  },
  thumbnail: {
    type: String, // Cloudinary URL
    required: [true, 'Thumbnail is required']
  },
  trailerVideo: {
    type: String, // Cloudinary URL
  },
  content: [{
    week: {
      type: Number,
      required: true,
      min: [1, 'Week must be at least 1']
    },
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Content title cannot be more than 100 characters']
    },
    titleAr: {
      type: String,
      maxlength: [100, 'Arabic content title cannot be more than 100 characters']
    },
    titleKu: {
      type: String,
      maxlength: [100, 'Kurdish content title cannot be more than 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Content description cannot be more than 500 characters']
    },
    videoUrl: {
      type: String, // Cloudinary URL
    },
    duration: {
      type: Number, // in minutes
      min: [1, 'Duration must be at least 1 minute']
    },
    materials: [{
      type: {
        type: String,
        enum: ['pdf', 'image', 'video', 'link'],
        required: true
      },
      title: {
        type: String,
        required: true,
        maxlength: [100, 'Material title cannot be more than 100 characters']
      },
      url: {
        type: String,
        required: true
      }
    }],
    exercises: [{
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      sets: Number,
      reps: Number,
      notes: String
    }],
    isPreview: {
      type: Boolean,
      default: false
    }
  }],
  prerequisites: [{
    type: String,
    maxlength: [200, 'Prerequisite cannot be more than 200 characters']
  }],
  learningObjectives: [{
    type: String,
    maxlength: [300, 'Learning objective cannot be more than 300 characters']
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number, // percentage
      default: 0,
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot be more than 100']
    },
    completedAt: Date,
    certificateIssued: {
      type: Boolean,
      default: false
    }
  }],
  maxStudents: {
    type: Number,
    min: [1, 'Maximum students must be at least 1']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
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
  reviews: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  language: {
    type: String,
    enum: ['en', 'ar', 'ku'],
    default: 'en'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ tags: 1 });

// Virtual for enrollment count
courseSchema.virtual('enrollmentCount').get(function() {
  return this.enrolledStudents.length;
});

// Virtual for completion rate
courseSchema.virtual('completionRate').get(function() {
  if (this.enrolledStudents.length === 0) return 0;
  const completed = this.enrolledStudents.filter(student => student.completedAt).length;
  return (completed / this.enrolledStudents.length) * 100;
});

// Static method to find published courses
courseSchema.statics.findPublished = function(filters = {}) {
  const query = { isPublished: true, isActive: true };
  if (filters.category) query.category = filters.category;
  if (filters.level) query.level = filters.level;
  if (filters.instructor) query.instructor = filters.instructor;
  if (filters.priceRange) {
    query.price = { $gte: filters.priceRange.min || 0, $lte: filters.priceRange.max || Infinity };
  }
  return this.find(query);
};

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId });
};

module.exports = mongoose.model('Course', courseSchema);