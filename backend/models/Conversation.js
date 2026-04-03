const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Group or direct message
  isGroup: {
    type: Boolean,
    default: false
  },
  
  // Group specific
  groupName: {
    type: String,
    required: function() {
      return this.isGroup;
    }
  },
  groupPhoto: {
    type: String
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.isGroup;
    }
  },

  // Members
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  // Last message info
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageText: {
    type: String
  },
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Unread counts per member
  unreadCounts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  }],

  // Muted for specific members
  mutedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Archived for specific members
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Custom metadata
  metadata: {
    workoutPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan'
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
conversationSchema.index({ members: 1, updatedAt: -1 });
conversationSchema.index({ lastMessage: 1 });
conversationSchema.index({ isGroup: 1 });
conversationSchema.index({ 'unreadCounts.userId': 1 });

// Virtual for display name
conversationSchema.virtual('displayName').get(function() {
  return this.isGroup ? this.groupName : 'Direct Message';
});

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  // Ensure all members are unique
  if (this.members) {
    this.members = [...new Set(this.members.map(m => m.toString()))].map(m => new mongoose.Types.ObjectId(m));
  }
  next();
});

// Static method to find or create direct message conversation
conversationSchema.statics.findOrCreateDirect = async function(userId1, userId2) {
  const members = [userId1, userId2].sort().map(id => id.toString());
  
  let conversation = await this.findOne({
    isGroup: false,
    members: { $all: members },
    $expr: { $eq: [{ $size: '$members' }, 2] }
  }).populate('members lastMessageSender lastMessage');

  if (!conversation) {
    conversation = await this.create({
      isGroup: false,
      members: members
    });
    await conversation.populate('members');
  }

  return conversation;
};

// Static method to find user conversations
conversationSchema.statics.findUserConversations = async function(userId, limit = 50, skip = 0) {
  return this.find({ members: userId })
    .populate('members', 'name email avatar')
    .populate('lastMessage')
    .populate('lastMessageSender', 'name avatar')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Instance method to add unread count
conversationSchema.methods.addUnreadCount = function(userId, count = 1) {
  const unreadEntry = this.unreadCounts.find(u => u.userId.toString() === userId.toString());
  if (unreadEntry) {
    unreadEntry.unreadCount += count;
  } else {
    this.unreadCounts.push({ userId, unreadCount: count });
  }
  return this.save();
};

// Instance method to reset unread count
conversationSchema.methods.resetUnreadCount = function(userId) {
  this.unreadCounts = this.unreadCounts.filter(u => u.userId.toString() !== userId.toString());
  return this.save();
};

// Instance method to mute/unmute
conversationSchema.methods.toggleMute = function(userId) {
  const isMuted = this.mutedBy.some(id => id.toString() === userId.toString());
  if (isMuted) {
    this.mutedBy = this.mutedBy.filter(id => id.toString() !== userId.toString());
  } else {
    this.mutedBy.push(userId);
  }
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);