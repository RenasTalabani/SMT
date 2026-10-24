'use strict';

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('Auth API', () => {
  it('registers a client and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User', email: 'test@example.com', password: 'Password123!', role: 'client',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
  });

  it('refuses self-registration as admin', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky', email: 'sneaky@example.com', password: 'Password123!', role: 'admin',
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects duplicate emails', async () => {
    const body = { name: 'Dup', email: 'dup@example.com', password: 'Password123!' };
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.statusCode).toBe(409);
  });

  it('logs in with correct password and rejects a wrong one', async () => {
    const u = await registerUser(app);
    const ok = await request(app).post('/api/auth/login').send({ email: u.email, password: u.password });
    expect(ok.statusCode).toBe(200);
    expect(ok.body.data.accessToken).toBeTruthy();

    const bad = await request(app).post('/api/auth/login').send({ email: u.email, password: 'nope-nope' });
    expect(bad.statusCode).toBe(401);
  });

  it('GET /auth/me returns the signed-in user', async () => {
    const u = await registerUser(app);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${u.token}`);
    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.body.data)).toContain(u.email);
  });

  it('refresh issues a new access token', async () => {
    const u = await registerUser(app);
    const r1 = await request(app).post('/api/auth/refresh').send({ refreshToken: u.refreshToken });
    expect(r1.statusCode).toBe(200);
    expect(r1.body.data.accessToken).toBeTruthy();
    expect(r1.body.data.refreshToken).toBeTruthy();
  });

  it('tokens from /auth/login are accepted by legacy routes (one token system)', async () => {
    const u = await registerUser(app);
    const res = await request(app).get('/api/progress').set('Authorization', `Bearer ${u.token}`);
    expect(res.statusCode).toBe(200);
  });

  it('protected routes reject missing tokens', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
