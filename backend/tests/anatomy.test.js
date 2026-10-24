'use strict';

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');
const BodyPart = require('../src/models/BodyPart');

let token;

beforeAll(async () => {
  await db.connect();
  await BodyPart.init(); // build text index
  ({ token } = await registerUser(app));
});
afterAll(db.close);

beforeEach(async () => {
  await BodyPart.deleteMany({});
  await BodyPart.insertMany([
    { partId: 'pectoralis_major', name: 'Pectoralis Major', type: 'muscle', region: 'upper_body', description: 'Chest muscle' },
    { partId: 'quadriceps', name: 'Quadriceps', type: 'muscle', region: 'lower_body', description: 'Front thigh' },
    { partId: 'knee_joint', name: 'Knee Joint', type: 'joint', region: 'lower_body', description: 'Hinge joint' },
    { partId: 'hidden', name: 'Hidden', type: 'muscle', region: 'core', isActive: false },
  ]);
});

const get = (url) => request(app).get(url).set('Authorization', `Bearer ${token}`);

describe('Anatomy API', () => {
  it('requires sign-in', async () => {
    const res = await request(app).get('/api/anatomy');
    expect(res.statusCode).toBe(401);
  });

  it('lists active parts only', async () => {
    const res = await get('/api/anatomy');
    expect(res.statusCode).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).toContain('Pectoralis Major');
    expect(body).not.toContain('"Hidden"');
  });

  it('filters by type and region', async () => {
    const byType = await get('/api/anatomy/type/joint');
    expect(byType.body.data.count).toBe(1);
    const byRegion = await get('/api/anatomy/region/lower_body');
    expect(byRegion.body.data.count).toBe(2);
  });

  it('looks up a part by its 3D-model id', async () => {
    const res = await get('/api/anatomy/part/quadriceps');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Quadriceps');
    const missing = await get('/api/anatomy/part/nope');
    expect(missing.statusCode).toBe(404);
  });
});
