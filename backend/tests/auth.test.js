const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/gym-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user and return tokens', async () => {
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client'
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with rotation', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const refreshToken = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

      // Refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(refreshRes.statusCode).toEqual(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      // Check that refresh token was rotated
      const newRefreshToken = refreshRes.headers['set-cookie'][0].split(';')[0].split('=')[1];
      expect(newRefreshToken).not.toBe(refreshToken);

      // Old token should not work
      const oldRefreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(oldRefreshRes.statusCode).toEqual(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user and clear tokens', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const accessToken = loginRes.body.data.accessToken;
      const refreshToken = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(logoutRes.statusCode).toEqual(200);
      expect(logoutRes.body.success).toBe(true);

      // Refresh should fail
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(refreshRes.statusCode).toEqual(401);
    });
  });
});