'use strict';

const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(72).required(),
  role: Joi.string().valid('client', 'coach').default('client'),
  phone: Joi.string().pattern(/^\+?[\d\s\-()]{7,20}$/).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(72).required(),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPassword = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).max(72).required(),
});

module.exports = { register, login, refreshToken, changePassword, forgotPassword, resetPassword };
