'use strict';

const User = require('../../../models/User');
const { generateTokenPair, verifyRefresh } = require('../../utils/jwt');
const { AppError } = require('../../middlewares/error.middleware');

async function register(data) {
  const email = (data.email || '').toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  const isApproved = data.role !== 'coach'; // clients & admins auto-approved, coaches need admin approval
  const user = await User.create({ ...data, email, isApproved });

  const tokens = generateTokenPair(user._id.toString(), user.role);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user: user.toPublicJSON(), ...tokens };
}

async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +refreshToken');
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await user.comparePassword(password);
  if (!match) throw new AppError('Invalid credentials', 401);

  if (!user.isActive) throw new AppError('Account is disabled', 403);

  const tokens = generateTokenPair(user._id.toString(), user.role);
  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  return { user: user.toPublicJSON(), ...tokens };
}

async function refresh(token) {
  let decoded;
  try {
    decoded = verifyRefresh(token);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user || user.refreshToken !== token) throw new AppError('Refresh token revoked', 401);

  const tokens = generateTokenPair(user._id.toString(), user.role);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return tokens;
}

async function logout(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user.toPublicJSON();
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
}

module.exports = { register, login, refresh, logout, getMe, changePassword };
