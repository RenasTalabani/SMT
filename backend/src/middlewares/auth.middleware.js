'use strict';

const User = require('../../models/User');
const { verifyAccess } = require('../utils/jwt');
const { AppError } = require('./error.middleware');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    const token = header.slice(7);
    const decoded = verifyAccess(token);

    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

function requireApproval(req, res, next) {
  if (!req.user?.isApproved) {
    return next(new AppError('Account pending approval', 403));
  }
  next();
}

module.exports = { protect, authorize, requireApproval };
