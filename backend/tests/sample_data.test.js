'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');
const Product = require('../src/models/Product');
const { products, coachAvatars } = require('../scripts/sample-data');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const auth = (u) => ({ Authorization: `Bearer ${u.token}` });
const publicDir = path.join(__dirname, '..', '..', 'web', 'public');

describe('Sample demo data', () => {
  it('every sample product is clearly marked and has a picture that exists', () => {
    expect(products.length).toBeGreaterThanOrEqual(12);
    for (const p of products) {
      expect(p.description).toMatch(/^\[SAMPLE\]/);
      expect(p.price).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(publicDir, p.imageUrl))).toBe(true);
      const svg = fs.readFileSync(path.join(publicDir, p.imageUrl), 'utf8');
      expect(svg).toContain('SAMPLE');
    }
    for (const file of Object.values(coachAvatars)) expect(fs.existsSync(path.join(publicDir, file))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'default-avatar.png'))).toBe(true);
  });

  it('the sample products are valid shop products', async () => {
    const saved = await Product.insertMany(products);
    expect(saved).toHaveLength(products.length);
    const list = await request(app).get('/api/shop/products');
    expect(list.body.data.products).toHaveLength(products.length);
    expect(list.body.data.products[0].imageUrl).toMatch(/^\/sample\/products\//);
  });

  it('admin can save a product with a site-relative picture path, but not a script URL', async () => {
    const admin = await registerUser(app, { role: 'admin' });
    const ok = await request(app).post('/api/shop/products').set(auth(admin))
      .send({ name: 'Shaker', price: 7000, stock: 1, category: 'gear', imageUrl: '/sample/products/shaker.svg' });
    expect(ok.statusCode).toBe(201);
    const bad = await request(app).post('/api/shop/products').set(auth(admin))
      .send({ name: 'Bad', price: 1, stock: 1, category: 'gear', imageUrl: 'javascript:alert(1)' });
    expect(bad.statusCode).toBe(400);
  });
});
