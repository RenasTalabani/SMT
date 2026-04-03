const express = require('express');
const https = require('https');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const User = require('../models/User');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordUpdate
} = require('../middlewares/validation');
const { protect } = require('../middlewares/auth');
const {
  sendEmailVerification,
  sendPasswordReset,
  sendWelcomeEmail
} = require('../services/email');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'client',
      phone,
      dateOfBirth,
      gender,
      height,
      weight,
      fitnessGoals,
      experienceLevel,
      specialization,
      certifications,
      bio,
      hourlyRate
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      dateOfBirth,
      gender,
      height,
      weight,
      fitnessGoals,
      experienceLevel,
      specialization,
      certifications,
      bio,
      hourlyRate
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    try {
      await sendEmailVerification(user, verificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail registration if email fails
    }

    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        accessToken,
        refreshToken  // included for mobile clients
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isApproved: user.isApproved
        },
        accessToken,
        refreshToken  // included for mobile clients
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // Clear all refresh tokens for security
    req.user.refreshTokens = [];
    await req.user.save();

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token with rotation
// @access  Public (with refresh token)
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);
    if (!tokenExists) {
      // Token reuse detected - clear all refresh tokens for security
      user.refreshTokens = [];
      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Remove old refresh token
    await user.removeRefreshToken(refreshToken);

    // Generate new refresh token
    const newRefreshToken = user.generateRefreshToken();

    // Add new refresh token
    await user.addRefreshToken(newRefreshToken);

    // Generate new access token
    const accessToken = user.generateAuthToken();

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', validatePasswordReset, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send reset email
    try {
      await sendPasswordReset(user, resetToken);
    } catch (emailError) {
      console.error('Password reset email error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', validatePasswordUpdate, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.params;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/verify-email/:token
// @desc    Verify email with token
// @access  Public
router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Don't fail verification if welcome email fails
    }

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated user)
// @access  Private
router.post('/change-password', protect, validatePasswordUpdate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          height: user.height,
          weight: user.weight,
          fitnessGoals: user.fitnessGoals,
          experienceLevel: user.experienceLevel,
          isEmailVerified: user.isEmailVerified,
          isApproved: user.isApproved,
          lastLogin: user.lastLogin,
          // Coach specific fields
          specialization: user.specialization,
          certifications: user.certifications,
          bio: user.bio,
          hourlyRate: user.hourlyRate,
          rating: user.rating,
          reviewCount: user.reviewCount
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ─── Social Auth Helpers ──────────────────────────────────────────────────────

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload();
  return { id: p.sub, email: p.email, name: p.name, avatar: p.picture };
}

function verifyFacebookToken(accessToken) {
  return new Promise((resolve, reject) => {
    const path = `/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,email,picture`;
    https.get({ hostname: 'graph.facebook.com', path }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const d = JSON.parse(raw);
          if (d.error) return reject(new Error(d.error.message));
          resolve({ id: d.id, email: d.email, name: d.name, avatar: d.picture?.data?.url });
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function verifyAppleToken(identityToken) {
  const payload = await appleSignin.verifyIdToken(identityToken, {
    audience: process.env.APPLE_BUNDLE_ID || 'com.citygym.app',
    ignoreExpiration: true,
  });
  return { id: payload.sub, email: payload.email };
}

async function findOrCreateSocialUser({ provider, providerId, email, name, avatar }) {
  // 1. Find by provider + providerId
  let user = await User.findOne({ provider, providerId });
  if (user) return user;

  // 2. Find by email — link provider to existing account
  if (email) {
    user = await User.findByEmail(email);
    if (user) {
      const alreadyLinked = user.linkedProviders.some(
        lp => lp.provider === provider && lp.providerId === providerId
      );
      if (!alreadyLinked) {
        user.linkedProviders.push({ provider, providerId, email });
        await user.save();
      }
      return user;
    }
  }

  // 3. Create new social user
  user = await User.create({
    name: name || 'User',
    email: email || `${providerId}@${provider}.noreply`,
    provider,
    providerId,
    role: 'client',
    isEmailVerified: true,
    avatar: avatar || null,
  });
  return user;
}

async function issueSocialResponse(res, user) {
  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is deactivated' });
  }
  user.lastLogin = new Date();
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        provider: user.provider,
      },
      accessToken,
    },
  });
}

// @route   POST /api/auth/social/google
// @access  Public
router.post('/social/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'idToken required' });

    const payload = await verifyGoogleToken(idToken);
    const user = await findOrCreateSocialUser({
      provider: 'google',
      providerId: payload.id,
      email: payload.email,
      name: payload.name,
      avatar: payload.avatar,
    });
    return issueSocialResponse(res, user);
  } catch (error) {
    console.error('Google social login error:', error);
    res.status(401).json({ success: false, message: 'Google authentication failed' });
  }
});

// @route   POST /api/auth/social/facebook
// @access  Public
router.post('/social/facebook', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ success: false, message: 'accessToken required' });

    const payload = await verifyFacebookToken(accessToken);
    const user = await findOrCreateSocialUser({
      provider: 'facebook',
      providerId: payload.id,
      email: payload.email,
      name: payload.name,
      avatar: payload.avatar,
    });
    return issueSocialResponse(res, user);
  } catch (error) {
    console.error('Facebook social login error:', error);
    res.status(401).json({ success: false, message: 'Facebook authentication failed' });
  }
});

// @route   POST /api/auth/social/apple
// @access  Public
router.post('/social/apple', async (req, res) => {
  try {
    const { identityToken, name } = req.body;
    if (!identityToken) return res.status(400).json({ success: false, message: 'identityToken required' });

    const payload = await verifyAppleToken(identityToken);
    const user = await findOrCreateSocialUser({
      provider: 'apple',
      providerId: payload.id,
      email: payload.email,
      name: name || payload.email?.split('@')[0] || 'Apple User',
    });
    return issueSocialResponse(res, user);
  } catch (error) {
    console.error('Apple social login error:', error);
    res.status(401).json({ success: false, message: 'Apple authentication failed' });
  }
});

module.exports = router;