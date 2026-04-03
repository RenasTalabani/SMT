const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { protect, authorize } = require('../middlewares/auth');
const { validateObjectId, validatePagination } = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get user conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all conversations where user is sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', userId] },
              then: '$receiver',
              else: '$sender'
            }
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
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
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$user._id',
            name: '$user.name',
            avatar: '$user.avatar',
            role: '$user.role',
            isOnline: '$user.isOnline'
          },
          lastMessage: {
            _id: '$lastMessage._id',
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            messageType: '$lastMessage.messageType'
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/chat/messages/:userId
// @desc    Get messages with specific user
// @access  Private
router.get('/messages/:userId', protect, validateObjectId, validatePagination, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages between current user and other user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        user: {
          _id: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          role: otherUser.role,
          isOnline: otherUser.isOnline
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/chat/messages
// @desc    Send message
// @access  Private
router.post('/messages', protect, async (req, res) => {
  try {
    const { receiver, content, messageType = 'text' } = req.body;

    if (!receiver || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver and content are required'
      });
    }

    // Verify receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Don't allow sending messages to self
    if (receiver === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      content,
      messageType,
      isRead: false
    });

    // Populate sender info
    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    res.status(201).json({
      success: true,
      data: { message },
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/chat/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/messages/:id/read', protect, validateObjectId, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get total unread messages count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/chat/messages/:id
// @desc    Delete message
// @access  Private
router.delete('/messages/:id', protect, validateObjectId, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/chat/typing/:userId
// @desc    Check if user is typing
// @access  Private
router.get('/typing/:userId', protect, validateObjectId, async (req, res) => {
  try {
    // This would typically be handled by Socket.io
    // For REST API, we can return a simple response
    res.json({
      success: true,
      data: { isTyping: false } // Placeholder
    });
  } catch (error) {
    console.error('Check typing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/chat/online-users
// @desc    Get online users for chat
// @access  Private
router.get('/online-users', protect, async (req, res) => {
  try {
    // Get users that are online and have chat enabled
    const onlineUsers = await User.find({
      isOnline: true,
      _id: { $ne: req.user._id }, // Exclude current user
      $or: [
        { role: 'coach' },
        { role: 'admin' },
        // For clients, only show their coach
        {
          role: 'client',
          coach: req.user._id
        }
      ]
    })
      .select('name avatar role specialization isOnline lastSeen')
      .limit(50);

    res.json({
      success: true,
      data: { onlineUsers }
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/chat/mark-all-read/:userId
// @desc    Mark all messages from user as read
// @access  Private
router.post('/mark-all-read/:userId', protect, validateObjectId, async (req, res) => {
  try {
    const result = await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      data: { updatedCount: result.modifiedCount },
      message: 'All messages marked as read'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ========== CONVERSATION ENDPOINTS ==========

// @route   GET /api/chat/conversation/list
// @desc    Get user's conversations
// @access  Private
router.get('/conversation/list', protect, validatePagination, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.findUserConversations(userId, limit, skip);
    const total = await Conversation.countDocuments({ members: userId });

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/chat/conversation/:conversationId/messages
// @desc    Get messages in a conversation
// @access  Private
router.get('/conversation/:conversationId/messages', protect, validateObjectId, validatePagination, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is member of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.members.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not a member of this conversation'
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversationId });

    // Mark messages as read
    await Message.updateMany(
      { conversationId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count
    await conversation.resetUnreadCount(userId);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/chat/conversation/create-direct
// @desc    Create or get direct message conversation
// @access  Private
router.post('/conversation/create-direct', protect, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Other user ID is required'
      });
    }

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow creating conversation with self
    if (otherUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    const conversation = await Conversation.findOrCreateDirect(req.user._id, otherUserId);

    res.status(201).json({
      success: true,
      data: { conversation },
      message: 'Conversation created/retrieved'
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/chat/conversation/create-group
// @desc    Create group conversation
// @access  Private
router.post('/conversation/create-group', protect, async (req, res) => {
  try {
    const { groupName, memberIds } = req.body;

    if (!groupName || !memberIds || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Group name and members are required'
      });
    }

    // Add current user to members
    const allMembers = [req.user._id, ...memberIds];

    const conversation = await Conversation.create({
      isGroup: true,
      groupName,
      members: allMembers,
      groupAdmin: req.user._id
    });

    await conversation.populate('members', 'name avatar email');

    res.status(201).json({
      success: true,
      data: { conversation },
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/chat/conversation/:conversationId/mark-read
// @desc    Mark conversation as read
// @access  Private
router.put('/conversation/:conversationId/mark-read', protect, validateObjectId, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.members.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not a member of this conversation'
      });
    }

    // Mark messages as read
    await Message.updateMany(
      { conversationId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count
    await conversation.resetUnreadCount(req.user._id);

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/chat/conversation/:conversationId/mute
// @desc    Mute/unmute conversation
// @access  Private
router.put('/conversation/:conversationId/mute', protect, validateObjectId, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.members.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not a member of this conversation'
      });
    }

    await conversation.toggleMute(req.user._id);

    res.json({
      success: true,
      message: 'Conversation mute toggled'
    });
  } catch (error) {
    console.error('Mute conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/chat/conversation/:conversationId
// @desc    Leave conversation
// @access  Private
router.delete('/conversation/:conversationId', protect, validateObjectId, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.members.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not a member of this conversation'
      });
    }

    // Remove user from members
    conversation.members = conversation.members.filter(
      m => m.toString() !== req.user._id.toString()
    );

    // If no members left, delete conversation
    if (conversation.members.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
    } else {
      await conversation.save();
    }

    res.json({
      success: true,
      message: 'Left conversation'
    });
  } catch (error) {
    console.error('Leave conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;