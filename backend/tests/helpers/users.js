'use strict';

const request = require('supertest');
const User = require('../../models/User');

let counter = 0;

// Registers a user through the real API and returns { user, token, refreshToken }.
async function registerUser(app, { role = 'client', approve = true, ...extra } = {}) {
  counter += 1;
  const body = {
    name: `${role} user ${counter}`,
    email: `${role}${counter}_${Date.now()}@example.com`,
    password: 'Password123!',
    role: role === 'admin' ? 'client' : role,
    ...extra,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  if (res.statusCode !== 201) {
    throw new Error(`register failed ${res.statusCode}: ${JSON.stringify(res.body)}`);
  }
  const { user, accessToken, refreshToken } = res.body.data;
  const id = user._id || user.id;

  // Admins can't self-register (by design) and coaches start unapproved.
  if (role === 'admin' || (role === 'coach' && approve)) {
    await User.findByIdAndUpdate(id, { role, isApproved: true });
  }
  return { user: { ...user, _id: id }, token: accessToken, refreshToken, password: body.password, email: body.email };
}

module.exports = { registerUser };
