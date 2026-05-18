'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

const userKey = (req) => req.user?._id?.toString() || req.ip;

const defaultLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyGenerator: userKey,
  message: { success: false, message: 'Too many AI requests. Please wait a few minutes.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: userKey,
  message: { success: false, message: 'Upload limit reached. Try again in 1 hour.' },
});

module.exports = { defaultLimiter, authLimiter, aiLimiter, uploadLimiter };
