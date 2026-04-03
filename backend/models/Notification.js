const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'workout_assigned',
      'workout_completed',
      'exercise_added',
      'course_enrolled',
      'course_completed',
      'progress_milestone',
      'coach_feedback',
      'message_received',
      'system_announcement',
      'payment_received',
      'coach_approved',
      'tip_published',
      'reminder',
      'plan_request',
      'ai_coach'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  data: {
    workoutPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan'
    },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise'
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    progress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Progress'
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    tip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tip'
    },
    amount: Number, // for payments
    customData: mongoose.Schema.Types.Mixed // for flexible additional data
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['workout', 'progress', 'social', 'system', 'payment', 'reminder', 'ai'],
    required: true
  },
  actionUrl: {
    type: String // URL to redirect user when they click the notification
  },
  expiresAt: {
    type: Date // For time-sensitive notifications
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Pre-save middleware to set read timestamp
notificationSchema.pre('save', function(next) {
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadForUser = function(userId, limit = 50) {
  return this.find({
    recipient: userId,
    isRead: false,
    isActive: true
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender', 'name avatar');
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(notificationIds, userId) {
  return this.updateMany(
    { _id: { $in: notificationIds }, recipient: userId },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to create workout-related notifications
notificationSchema.statics.createWorkoutNotification = function(recipientId, senderId, workoutPlanId, type, title, message) {
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    category: 'workout',
    data: { workoutPlan: workoutPlanId }
  });
};

// Static method to create progress-related notifications
notificationSchema.statics.createProgressNotification = function(recipientId, senderId, progressId, type, title, message) {
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    category: 'progress',
    data: { progress: progressId }
  });
};

// Static method to create system notifications
notificationSchema.statics.createSystemNotification = function(recipientId, type, title, message, data = {}) {
  return this.create({
    recipient: recipientId,
    type,
    title,
    message,
    category: 'system',
    data
  });
};

// Static method to create reminder notifications
notificationSchema.statics.createReminder = function(recipientId, title, message, actionUrl, expiresAt) {
  return this.create({
    recipient: recipientId,
    type: 'reminder',
    title,
    message,
    category: 'reminder',
    actionUrl,
    expiresAt,
    priority: 'high'
  });
};

// Static method to get notification statistics for user
notificationSchema.statics.getStatsForUser = function(userId) {
  return this.aggregate([
    { $match: { recipient: new mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
        byCategory: {
          $push: {
            category: '$category',
            isRead: '$isRead'
          }
        }
      }
    },
    {
      $project: {
        total: 1,
        unread: 1,
        read: { $subtract: ['$total', '$unread'] },
        categories: {
          $reduce: {
            input: '$byCategory',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $cond: {
                    if: '$$this.isRead',
                    then: { [$$this.category]: { $add: [{ $ifNull: ['$$value.$$this.category', 0] }, 1] } },
                    else: { [$$this.category]: { $ifNull: ['$$value.$$this.category', 0] } }
                  }
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Notification', notificationSchema);