const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },
  contentAr: {
    type: String,
    maxlength: [2000, 'Arabic content cannot be more than 2000 characters']
  },
  contentKu: {
    type: String,
    maxlength: [2000, 'Kurdish content cannot be more than 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['nutrition', 'training', 'recovery', 'motivation', 'equipment', 'technique', 'lifestyle', 'supplements']
  },
  type: {
    type: String,
    enum: ['tip', 'hack', 'guide', 'article'],
    default: 'tip'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
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
    caption: {
      type: String,
      maxlength: [200, 'Caption cannot be more than 200 characters']
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
  featured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  }],
  relatedExercises: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  relatedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot be more than 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot be more than 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
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
tipSchema.index({ category: 1 });
tipSchema.index({ type: 1 });
tipSchema.index({ author: 1 });
tipSchema.index({ isPublished: 1 });
tipSchema.index({ isActive: 1 });
tipSchema.index({ featured: 1 });
tipSchema.index({ tags: 1 });
tipSchema.index({ publishedAt: -1 });

// Virtual for like count
tipSchema.virtual('likeCount').get(function() {
  return (this.likes || []).length;
});

// Virtual for comment count
tipSchema.virtual('commentCount').get(function() {
  return (this.comments || []).length;
});

// Pre-save middleware to set publishedAt
tipSchema.pre('save', function(next) {
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Static method to find published tips
tipSchema.statics.findPublished = function(filters = {}) {
  const query = { isPublished: true, isActive: true };
  if (filters.category) query.category = filters.category;
  if (filters.type) query.type = filters.type;
  if (filters.author) query.author = filters.author;
  if (filters.featured !== undefined) query.featured = filters.featured;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  return this.find(query).sort({ publishedAt: -1 });
};

// Static method to find popular tips
tipSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isPublished: true, isActive: true })
    .sort({ views: -1, likeCount: -1 })
    .limit(limit);
};

// Static method to find tips by category
tipSchema.statics.findByCategory = function(category, limit = 20) {
  return this.find({ category, isPublished: true, isActive: true })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Tip', tipSchema);