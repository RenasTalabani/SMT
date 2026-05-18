'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

function signAccess(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
    issuer: 'citygym',
  });
}

function signRefresh(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
    issuer: 'citygym',
  });
}

function verifyAccess(token) {
  return jwt.verify(token, config.jwt.accessSecret, { issuer: 'citygym' });
}

function verifyRefresh(token) {
  return jwt.verify(token, config.jwt.refreshSecret, { issuer: 'citygym' });
}

function generateTokenPair(userId, role) {
  const payload = { userId, role };
  return {
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
  };
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, generateTokenPair };
