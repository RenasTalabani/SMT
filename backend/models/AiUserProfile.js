const mongoose = require('mongoose');

// ── Sub-schema: stored recommendations ────────────────────────────────────────
const recommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['workout', 'tip', 'course', 'motivation', 'adjustment'],
    required: true
  },
  content: { type: String, required: true, maxlength: 1000 },
  generatedAt: { type: Date, default: Date.now },
  wasActedOn: { type: Boolean, default: false }
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────
const aiUserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Context the AI learns about the user over time
  goals: [{ type: String, maxlength: 100 }],
  injuries: [{ type: String, maxlength: 200 }],
  preferredExercises: [{ type: String, maxlength: 100 }],
  weakPoints: [{ type: String, maxlength: 100 }],

  // ── Training behavior tracking ─────────────────────────────────────────────
  trainingConsistency: {
    totalCompleted: { type: Number, default: 0, min: 0 },
    totalSkipped:   { type: Number, default: 0, min: 0 },
    currentStreak:  { type: Number, default: 0, min: 0 },
    longestStreak:  { type: Number, default: 0, min: 0 },
    lastWorkoutDate: { type: Date, default: null },
    weeklyRate: { type: Number, default: 0, min: 0, max: 100 } // 0-100 %
  },

  // ── Derived behavior flags (recomputed on every record call) ───────────────
  behavior: {
    isConsistent:        { type: Boolean, default: false }, // weeklyRate >= 70 + streak >= 3
    isInactive:          { type: Boolean, default: false }, // no workout in 3+ days
    inactiveDays:        { type: Number,  default: 0 },
    needsMotivation:     { type: Boolean, default: false }, // 2+ days without workout
    readyForProgression: { type: Boolean, default: false }  // streak >= 14 days
  },

  // Current coaching tone derived from behavior
  coachingLevel: {
    type: String,
    enum: ['gentle', 'moderate', 'intense'],
    default: 'moderate'
  },

  // Last 5 recommendations generated for this user
  lastRecommendations: { type: [recommendationSchema], default: [] },

  // Daily tip cache — reset each day
  lastDailyTipDate: { type: Date, default: null },
  lastDailyTip:     { type: String, default: null, maxlength: 500 },

  lastAnalyzedAt: { type: Date, default: null }
}, { timestamps: true });

// ── Instance methods ──────────────────────────────────────────────────────────

/**
 * Call after every confirmed workout completion.
 * Updates streak, totalCompleted, lastWorkoutDate, then refreshes behavior flags.
 */
aiUserProfileSchema.methods.recordCompletion = function () {
  const now = new Date();
  const last = this.trainingConsistency.lastWorkoutDate;

  this.trainingConsistency.totalCompleted += 1;

  if (last) {
    const daysSinceLast = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    // Same day or next-day counts as continuing the streak
    this.trainingConsistency.currentStreak = daysSinceLast <= 2
      ? this.trainingConsistency.currentStreak + 1
      : 1;
  } else {
    this.trainingConsistency.currentStreak = 1;
  }

  this.trainingConsistency.lastWorkoutDate = now;

  if (this.trainingConsistency.currentStreak > this.trainingConsistency.longestStreak) {
    this.trainingConsistency.longestStreak = this.trainingConsistency.currentStreak;
  }

  this._refreshBehaviorFlags();
};

/**
 * Call when a scheduled workout is skipped/missed.
 */
aiUserProfileSchema.methods.recordSkip = function () {
  this.trainingConsistency.totalSkipped += 1;
  this.trainingConsistency.currentStreak = 0;
  this._refreshBehaviorFlags();
};

/**
 * Recompute all behavior flags + coachingLevel from current consistency data.
 */
aiUserProfileSchema.methods._refreshBehaviorFlags = function () {
  const c = this.trainingConsistency;
  const total = c.totalCompleted + c.totalSkipped;

  // Recalculate weekly rate
  if (total > 0) {
    c.weeklyRate = Math.round((c.totalCompleted / total) * 100);
  }

  // Inactivity
  if (c.lastWorkoutDate) {
    const daysSince = Math.floor((new Date() - c.lastWorkoutDate) / (1000 * 60 * 60 * 24));
    this.behavior.inactiveDays = daysSince;
    this.behavior.isInactive = daysSince >= 3;
    this.behavior.needsMotivation = daysSince >= 2;
  } else {
    this.behavior.isInactive = false;
    this.behavior.needsMotivation = false;
    this.behavior.inactiveDays = 0;
  }

  this.behavior.isConsistent        = c.weeklyRate >= 70 && c.currentStreak >= 3;
  this.behavior.readyForProgression = c.currentStreak >= 14;

  // Coaching level
  if (this.behavior.readyForProgression)    this.coachingLevel = 'intense';
  else if (this.behavior.needsMotivation)   this.coachingLevel = 'gentle';
  else                                       this.coachingLevel = 'moderate';
};

/**
 * Prepend a new recommendation, keeping only the latest 5.
 */
aiUserProfileSchema.methods.addRecommendation = function (type, content) {
  this.lastRecommendations.unshift({ type, content, generatedAt: new Date() });
  if (this.lastRecommendations.length > 5) {
    this.lastRecommendations = this.lastRecommendations.slice(0, 5);
  }
};

module.exports = mongoose.model('AiUserProfile', aiUserProfileSchema);
