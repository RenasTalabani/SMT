const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'apple'],
    default: 'local'
  },
  providerId: {
    type: String,
    default: null
  },
  linkedProviders: [{
    provider: { type: String, enum: ['google', 'facebook', 'apple'] },
    providerId: String,
    email: String,
    linkedAt: { type: Date, default: Date.now }
  }],
  role: {
    type: String,
    enum: ['client', 'coach', 'admin'],
    default: 'client'
  },
  avatar: {
    type: String, // Cloudinary URL
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  height: {
    type: Number, // in cm
    min: [50, 'Height must be at least 50cm'],
    max: [300, 'Height cannot be more than 300cm']
  },
  weight: {
    type: Number, // in kg
    min: [20, 'Weight must be at least 20kg'],
    max: [500, 'Weight cannot be more than 500kg']
  },
  fitnessGoals: [{
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness']
  }],
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshToken: {
    type: String,
    default: null,
    select: false,
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  // Coach specific fields
  specialization: [{
    type: String,
    enum: ['strength_training', 'cardio', 'yoga', 'pilates', 'crossfit', 'bodybuilding', 'sports_training']
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date,
    expiryDate: Date
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative']
  },
  experienceYears: {
    type: Number,
    min: [0, 'Experience years cannot be negative'],
    default: null
  },
  isApproved: {
    type: Boolean,
    default: false // Admin approval required for coaches
  },
  fcmToken: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isApproved: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false; // Social auth users have no password
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate auth token
userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to add refresh token
userSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens.push({ token });
  return this.save();
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// ── toPublicJSON — safe representation for API responses ──────────────────
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar || null,
    isEmailVerified: this.isEmailVerified || false,
    isApproved: this.isApproved || false,
    isActive: this.isActive !== false,
    phone: this.phone || null,
    gender: this.gender || null,
    height: this.height || null,
    weight: this.weight || null,
    fitnessGoals: this.fitnessGoals || [],
    experienceLevel: this.experienceLevel || 'beginner',
    specialization: this.specialization || [],
    bio: this.bio || null,
    hourlyRate: this.hourlyRate || null,
    experienceYears: this.experienceYears || null,
    rating: this.rating || 0,
    reviewCount: this.reviewCount || 0,
    lastLogin: this.lastLogin || null,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);