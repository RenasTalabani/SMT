const express = require('express');
const User = require('../models/User');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const { uploadAvatar, handleMulterError } = require('../middlewares/upload');
const { uploadAvatar: uploadAvatarToCloudinary } = require('../services/cloudinary');
const { validateObjectId } = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';

    const users = await User.find(filter)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/coaches
// @desc    Get all approved coaches
// @access  Public
router.get('/coaches', async (req, res) => {
  try {
    const coaches = await User.find({
      role: 'coach',
      isApproved: true,
      isActive: true
    })
      .select('name avatar specialization bio rating reviewCount hourlyRate experienceYears')
      .sort({ rating: -1 });

    res.json({
      success: true,
      data: { coaches }
    });
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only view their own profile or coaches can view their clients
    if (req.user.role !== 'admin' &&
        req.user._id.toString() !== user._id.toString() &&
        !(req.user.role === 'coach' && user.assignedCoach === req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only update their own profile, or admins can update any profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    const allowedFields = [
      'name', 'phone', 'dateOfBirth', 'gender', 'height', 'weight',
      'fitnessGoals', 'experienceLevel', 'specialization', 'certifications',
      'bio', 'hourlyRate'
    ];

    // Filter allowed fields
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id/avatar
// @desc    Update user avatar
// @access  Private
router.put('/:id/avatar', protect, validateObjectId, uploadAvatar.single('avatar'), handleMulterError, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only update their own avatar
    if (req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user avatar'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file provided'
      });
    }

    // Upload to Cloudinary
    const avatarData = await uploadAvatarToCloudinary(req.file.path, user._id);

    // Update user
    user.avatar = avatarData.url;
    await user.save();

    res.json({
      success: true,
      data: {
        avatar: user.avatar
      },
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), validateObjectId, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user },
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id/approve
// @desc    Approve coach (admin only)
// @access  Private/Admin
router.put('/:id/approve', protect, authorize('admin'), validateObjectId, async (req, res) => {
  try {
    const { isApproved, reason } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'coach') {
      return res.status(400).json({
        success: false,
        message: 'User is not a coach'
      });
    }

    user.isApproved = isApproved;
    await user.save();

    // Send email notification
    try {
      if (isApproved) {
        const { sendCoachApproval } = require('../services/email');
        await sendCoachApproval(user);
      } else {
        const { sendCoachRejection } = require('../services/email');
        await sendCoachRejection(user, reason);
      }
    } catch (emailError) {
      console.error('Coach approval email error:', emailError);
      // Don't fail the approval process if email fails
    }

    res.json({
      success: true,
      message: `Coach ${isApproved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Coach approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/me
// @desc    Delete my own account and personal data (Google Play / App Store
//          require in-app account deletion). Body: { confirm: "DELETE" }
// @access  Private
router.delete('/me', protect, async (req, res) => {
  try {
    if (!req.body || req.body.confirm !== 'DELETE') {
      return res.status(400).json({ success: false, message: 'Send { "confirm": "DELETE" } to delete your account' });
    }
    const userId = req.user._id;
    const {
      CoachRenasSubscription, CoachRenasClient, CoachRenasCheckIn,
    } = require('../src/models/CoachRenas');
    const AiChat = require('../models/AiChat');
    const AiUserProfile = require('../models/AiUserProfile');
    await Promise.all([
      CoachRenasClient.deleteMany({ user: userId }),
      CoachRenasCheckIn.deleteMany({ user: userId }),
      // Payment records are kept (anonymised) for accounting.
      CoachRenasSubscription.updateMany({ user: userId }, { $unset: { receiptUrl: 1, storeToken: 1, note: 1 } }),
      AiChat.deleteMany({ userId }),
      AiUserProfile.deleteMany({ userId }),
    ]);
    await User.deleteOne({ _id: userId });
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete own account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id/clients
// @desc    Get coach's clients
// @access  Private/Coach
router.get('/:id/clients', protect, requireApproval, validateObjectId, async (req, res) => {
  try {
    // Only the coach themselves or admin can view clients
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these clients'
      });
    }

    // Find workout plans created by this coach and get assigned users
    const WorkoutPlan = require('../models/WorkoutPlan');
    const workoutPlans = await WorkoutPlan.find({
      createdBy: req.params.id,
      assignedTo: { $exists: true, $ne: null }
    }).populate('assignedTo', 'name email avatar lastLogin');

    const clients = workoutPlans.map(plan => plan.assignedTo).filter(client => client);

    // Remove duplicates
    const uniqueClients = clients.filter((client, index, self) =>
      index === self.findIndex(c => c._id.toString() === client._id.toString())
    );

    res.json({
      success: true,
      data: { clients: uniqueClients }
    });
  } catch (error) {
    console.error('Get coach clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ── POST /api/users/fcm-token — register or update FCM push token ──────────────
router.post('/fcm-token', protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }
    await User.findByIdAndUpdate(req.user._id, { fcmToken: token.trim() });
    res.json({ success: true, message: 'FCM token registered' });
  } catch (error) {
    console.error('FCM token error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;