'use strict';

const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    ApiResponse.created(res, result, 'Registration successful');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    ApiResponse.success(res, result, 'Login successful');
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.body.refreshToken);
    ApiResponse.success(res, tokens, 'Tokens refreshed');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id);
    ApiResponse.success(res, {}, 'Logged out');
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    ApiResponse.success(res, { user });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
    ApiResponse.success(res, {}, 'Password changed successfully');
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout, me, changePassword };
