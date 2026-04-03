const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  threadId: {
    type: String // For grouping related messages
  },
  metadata: {
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
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ threadId: 1 });
messageSchema.index({ isRead: 1 });

// Pre-save middleware to set delivered timestamp
messageSchema.pre('save', function(next) {
  if (this.isDelivered && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to find conversation between two users
messageSchema.statics.findConversation = function(user1Id, user2Id, limit = 50) {
  return this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender', 'name avatar')
  .populate('receiver', 'name avatar');
};

// Static method to find unread messages for user
messageSchema.statics.findUnreadForUser = function(userId) {
  return this.find({
    receiver: userId,
    isRead: false
  })
  .sort({ createdAt: -1 })
  .populate('sender', 'name avatar');
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(messageIds, userId) {
  return this.updateMany(
    { _id: { $in: messageIds }, receiver: userId },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get conversation list for user
messageSchema.statics.getConversationsForUser = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: new mongoose.Types.ObjectId(userId) }, { receiver: new mongoose.Types.ObjectId(userId) }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
            then: { user: '$receiver', conversationId: { $concat: [userId, '_', { $toString: '$receiver' }] } },
            else: { user: '$sender', conversationId: { $concat: [{ $toString: '$sender' }, '_', userId] } }
          }
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] }, { $eq: ['$isRead', false] }] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.user',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        conversationId: '$_id.conversationId',
        user: {
          _id: '$user._id',
          name: '$user.name',
          avatar: '$user.avatar',
          role: '$user.role'
        },
        lastMessage: {
          _id: '$lastMessage._id',
          content: '$lastMessage.content',
          createdAt: '$lastMessage.createdAt',
          isRead: '$lastMessage.isRead'
        },
        unreadCount: 1
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

module.exports = mongoose.model('Message', messageSchema);