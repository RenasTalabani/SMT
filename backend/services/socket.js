const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');

// Store active users
const activeUsers = new Map();

const initializeSocket = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('Invalid user'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected with socket ${socket.id}`);

    // Add user to active users
    activeUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      user: socket.user
    });

    // Join user-specific room
    socket.join(`user_${socket.user._id}`);

    // Join role-specific room
    socket.join(`role_${socket.user.role}`);

    // Handle user going online
    socket.on('user_online', () => {
      socket.broadcast.emit('user_status_changed', {
        userId: socket.user._id,
        status: 'online'
      });
    });

    // Handle private messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, messageType = 'text', attachments = [] } = data;

        // Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('message_error', { message: 'Receiver not found' });
          return;
        }

        // Create message
        const message = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          content,
          messageType,
          attachments
        });

        // Populate sender and receiver data
        await message.populate('sender', 'name avatar');
        await message.populate('receiver', 'name avatar');

        // Send to receiver if online
        const receiverSocket = activeUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('new_message', message);
        }

        // Send confirmation to sender
        socket.emit('message_sent', message);

        // Create notification for receiver
        await Notification.create({
          recipient: receiverId,
          sender: socket.user._id,
          type: 'message_received',
          title: 'New Message',
          message: `You have a new message from ${socket.user.name}`,
          category: 'social',
          data: { message: message._id }
        });

        // Emit notification to receiver
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('new_notification', {
            type: 'message_received',
            title: 'New Message',
            message: `You have a new message from ${socket.user.name}`,
            data: { message: message._id }
          });
        }

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      const receiverSocket = activeUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('typing_started', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      const receiverSocket = activeUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('typing_stopped', {
          userId: socket.user._id
        });
      }
    });

    // Handle message read status
    socket.on('mark_messages_read', async (data) => {
      try {
        const { senderId, messageIds } = data;

        await Message.updateMany(
          { _id: { $in: messageIds }, receiver: socket.user._id, sender: senderId },
          { isRead: true, readAt: new Date() }
        );

        // Notify sender that messages were read
        const senderSocket = activeUsers.get(senderId);
        if (senderSocket) {
          io.to(senderSocket.socketId).emit('messages_read', {
            readerId: socket.user._id,
            messageIds
          });
        }

      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Handle workout progress updates
    socket.on('workout_progress_update', async (data) => {
      try {
        const { workoutPlanId, progress } = data;

        // Notify coach if client updated progress
        if (socket.user.role === 'client') {
          // Find coach assigned to this workout plan
          const WorkoutPlan = require('../models/WorkoutPlan');
          const workoutPlan = await WorkoutPlan.findById(workoutPlanId).populate('createdBy');

          if (workoutPlan && workoutPlan.createdBy) {
            const coachSocket = activeUsers.get(workoutPlan.createdBy._id.toString());
            if (coachSocket) {
              io.to(coachSocket.socketId).emit('client_progress_update', {
                clientId: socket.user._id,
                clientName: socket.user.name,
                workoutPlanId,
                progress
              });
            }
          }
        }

      } catch (error) {
        console.error('Workout progress update error:', error);
      }
    });

    // Handle live workout sessions
    socket.on('join_workout_session', (data) => {
      const { sessionId } = data;
      socket.join(`workout_session_${sessionId}`);

      socket.to(`workout_session_${sessionId}`).emit('user_joined_session', {
        userId: socket.user._id,
        userName: socket.user.name,
        role: socket.user.role
      });
    });

    socket.on('leave_workout_session', (data) => {
      const { sessionId } = data;
      socket.leave(`workout_session_${sessionId}`);

      socket.to(`workout_session_${sessionId}`).emit('user_left_session', {
        userId: socket.user._id,
        userName: socket.user.name
      });
    });

    // Helper to derive category from notification type
    const getCategoryFromType = (type) => {
      const categoryMap = {
        workout_assigned: 'workout',
        workout_completed: 'workout',
        exercise_added: 'workout',
        progress_milestone: 'progress',
        progress_update: 'progress',
        coach_feedback: 'progress',
        message_received: 'social',
        payment_received: 'payment',
        coach_approved: 'system',
        system_announcement: 'system',
        tip_published: 'system',
        course_enrolled: 'system',
        course_completed: 'system',
        reminder: 'reminder'
      };
      return categoryMap[type] || 'system';
    };

    // Handle real-time notifications
    socket.on('send_notification', async (data) => {
      try {
        const { recipientId, type, title, message, data: notificationData, priority = 'medium', category } = data;

        const notification = await Notification.create({
          recipient: recipientId,
          sender: socket.user._id,
          type,
          title,
          message,
          category: category || getCategoryFromType(type),
          data: notificationData,
          priority
        });

        // Populate sender info
        await notification.populate('sender', 'name avatar');

        const recipientSocket = activeUsers.get(recipientId.toString());
        if (recipientSocket) {
          io.to(recipientSocket.socketId).emit('notification_created', {
            notification,
            unreadCount: await Notification.countDocuments({
              recipient: recipientId,
              isRead: false
            })
          });
        }

      } catch (error) {
        console.error('Send notification error:', error);
      }
    });

    // Handle mark notification as read
    socket.on('mark_notification_read', async (data) => {
      try {
        const { notificationId } = data;

        await Notification.findByIdAndUpdate(notificationId, {
          isRead: true,
          readAt: new Date()
        });

        // Notify the user's other connections
        socket.emit('notification_read', { notificationId });

      } catch (error) {
        console.error('Mark notification read error:', error);
      }
    });

    // Handle mark all notifications as read
    socket.on('mark_all_notifications_read', async (data) => {
      try {
        await Notification.updateMany(
          { recipient: socket.user._id, isRead: false },
          { isRead: true, readAt: new Date() }
        );

        // Notify all user connections
        io.to(`user_${socket.user._id}`).emit('all_notifications_read', {
          userId: socket.user._id
        });

      } catch (error) {
        console.error('Mark all notifications read error:', error);
      }
    });

    // Handle conversation events
    socket.on('join_conversation', (data) => {
      const { conversationId } = data;
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
    });

    // Handle conversation messages
    socket.on('send_conversation_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', attachments = [] } = data;

        // Verify user is member of conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.members.includes(socket.user._id)) {
          socket.emit('message_error', { message: 'Not a member of this conversation' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversationId,
          sender: socket.user._id,
          content,
          messageType,
          attachments
        });

        // Populate sender
        await message.populate('sender', 'name avatar');

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageText = content;
        conversation.lastMessageSender = socket.user._id;
        await conversation.save();

        // Emit to all members in the conversation room
        io.to(`conversation_${conversationId}`).emit('new_conversation_message', {
          message,
          conversation
        });

        // Add unread count for other members
        for (const memberId of conversation.members) {
          if (memberId.toString() !== socket.user._id.toString()) {
            await conversation.addUnreadCount(memberId);
          }
        }

        // Send message notification to other members
        const senderData = socket.user;
        for (const memberId of conversation.members) {
          if (memberId.toString() !== socket.user._id.toString()) {
            await sendUserNotification(io, memberId, {
              type: 'message_received',
              title: `New message from ${senderData.name}`,
              message: content.substring(0, 100),
              category: 'social',
              priority: 'medium',
              senderId: socket.user._id,
              data: {
                conversationId: conversationId.toString(),
                messageId: message._id.toString()
              },
              actionUrl: `/client/chat?conversation=${conversationId}`
            });
          }
        }

      } catch (error) {
        console.error('Send conversation message error:', error);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    // Handle typing in conversation
    socket.on('typing_start_conversation', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.user._id,
        userName: socket.user.name,
        conversationId
      });
    });

    socket.on('typing_stop_conversation', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
        userId: socket.user._id,
        conversationId
      });
    });

    // Handle mark conversation as read
    socket.on('mark_conversation_read', async (data) => {
      try {
        const { conversationId } = data;

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await conversation.resetUnreadCount(socket.user._id);

          // Mark messages as read
          await Message.updateMany(
            { conversationId, isRead: false },
            { isRead: true, readAt: new Date() }
          );

          io.to(`conversation_${conversationId}`).emit('conversation_marked_read', {
            userId: socket.user._id,
            conversationId
          });
        }

      } catch (error) {
        console.error('Mark conversation read error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);

      // Remove from active users
      activeUsers.delete(socket.user._id.toString());

      // Notify others about offline status
      socket.broadcast.emit('user_status_changed', {
        userId: socket.user._id,
        status: 'offline'
      });
    });
  });

  // Periodic cleanup of inactive users (optional)
  setInterval(() => {
    // This could be enhanced to check actual socket connectivity
    console.log(`Active users: ${activeUsers.size}`);
  }, 300000); // Every 5 minutes
};

// Helper function to get active user
const getActiveUser = (userId) => {
  return activeUsers.get(userId.toString());
};

// Helper function to get all active users
const getActiveUsers = () => {
  return Array.from(activeUsers.values());
};

// Helper function to emit to user
const emitToUser = (io, userId, event, data) => {
  const userSocket = activeUsers.get(userId.toString());
  if (userSocket) {
    io.to(userSocket.socketId).emit(event, data);
    return true;
  }
  return false;
};

// Helper function to send notification to user via Socket.io
const sendUserNotification = async (io, recipientId, notificationData) => {
  try {
    const { type, title, message, category = 'system', priority = 'medium', data, actionUrl } = notificationData;

    // Create notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      sender: notificationData.senderId || null,
      type,
      title,
      message,
      category,
      priority,
      data,
      actionUrl
    });

    // Populate sender if exists
    if (notification.sender) {
      await notification.populate('sender', 'name avatar');
    }

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      isRead: false
    });

    // Emit to user's room
    io.to(`user_${recipientId}`).emit('notification_created', {
      notification,
      unreadCount
    });

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Helper function to send notifications to multiple users
const sendBulkNotifications = async (io, recipientIds, notificationData) => {
  try {
    const notifications = [];

    for (const recipientId of recipientIds) {
      const notification = await sendUserNotification(io, recipientId, notificationData);
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

// Helper function to send message notification
const sendMessageNotification = async (io, conversationId, message, conversation) => {
  try {
    const nonSenderMembers = conversation.members.filter(
      (memberId) => memberId.toString() !== message.sender.toString()
    );

    for (const memberId of nonSenderMembers) {
      const sender = await User.findById(message.sender).select('name avatar');
      await sendUserNotification(io, memberId, {
        type: 'message_received',
        title: `New message from ${sender.name}`,
        message: message.content.substring(0, 100),
        category: 'social',
        priority: 'medium',
        senderId: message.sender,
        data: {
          conversationId: conversationId.toString(),
          messageId: message._id.toString()
        },
        actionUrl: `/client/chat?conversation=${conversationId}`
      });
    }
  } catch (error) {
    console.error('Error sending message notification:', error);
  }
};

// Helper function to send workout notification
const sendWorkoutNotification = async (io, recipientId, workout, type = 'workout_assigned') => {
  try {
    const notificationMap = {
      workout_assigned: {
        title: `New Workout: ${workout.name}`,
        message: `You have been assigned a new workout. Start your training now!`,
        category: 'workout',
        priority: 'high'
      },
      workout_completed: {
        title: 'Workout Completed! 💪',
        message: `Great job completing your workout!`,
        category: 'workout',
        priority: 'medium'
      },
      workout_reminder: {
        title: 'Time for your workout!',
        message: `Don't forget to complete your ${workout.name} workout today.`,
        category: 'reminder',
        priority: 'medium'
      }
    };

    const notification = notificationMap[type] || notificationMap.workout_assigned;

    await sendUserNotification(io, recipientId, {
      type,
      ...notification,
      senderId: workout.coach,
      data: {
        workoutId: workout._id.toString()
      },
      actionUrl: `/client/workouts/${workout._id}`
    });
  } catch (error) {
    console.error('Error sending workout notification:', error);
  }
};

// Helper function to send progress notification
const sendProgressNotification = async (io, recipientId, progress, type = 'progress_milestone') => {
  try {
    const notificationMap = {
      progress_milestone: {
        title: '🎉 Milestone Reached!',
        message: `Great progress! You've reached a new milestone.`,
        category: 'progress',
        priority: 'high'
      },
      progress_update: {
        title: 'Progress Update',
        message: `Your progress has been updated. Keep up the good work!`,
        category: 'progress',
        priority: 'medium'
      }
    };

    const notification = notificationMap[type] || notificationMap.progress_update;

    await sendUserNotification(io, recipientId, {
      type,
      ...notification,
      data: {
        progressId: progress._id.toString()
      },
      actionUrl: `/client/progress`
    });
  } catch (error) {
    console.error('Error sending progress notification:', error);
  }
};

module.exports = {
  initializeSocket,
  getActiveUser,
  getActiveUsers,
  emitToUser,
  sendUserNotification,
  sendBulkNotifications,
  sendMessageNotification,
  sendWorkoutNotification,
  sendProgressNotification
};