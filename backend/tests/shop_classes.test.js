'use strict';

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const auth = (u) => ({ Authorization: `Bearer ${u.token}` });

describe('Shop', () => {
  it('admin adds a product, member orders, stock moves, cancel restores it', async () => {
    const admin = await registerUser(app, { role: 'admin' });
    const member = await registerUser(app);

    const created = await request(app).post('/api/shop/products').set(auth(admin))
      .send({ name: 'Whey Protein 2kg', price: 65000, stock: 3, category: 'supplement' });
    expect(created.statusCode).toBe(201);
    const productId = created.body.data.product._id;

    // members can't add products
    const nope = await request(app).post('/api/shop/products').set(auth(member)).send({ name: 'X', price: 1 });
    expect(nope.statusCode).toBe(403);

    const list = await request(app).get('/api/shop/products');
    expect(list.body.data.products).toHaveLength(1);

    const order = await request(app).post('/api/shop/orders').set(auth(member))
      .send({ items: [{ productId, quantity: 2 }] });
    expect(order.statusCode).toBe(201);
    expect(order.body.data.order.total).toBe(130000);

    const tooMany = await request(app).post('/api/shop/orders').set(auth(member))
      .send({ items: [{ productId, quantity: 2 }] });
    expect(tooMany.statusCode).toBe(400); // only 1 left

    const cancel = await request(app).put(`/api/shop/orders/${order.body.data.order._id}/status`).set(auth(member))
      .send({ status: 'cancelled' });
    expect(cancel.statusCode).toBe(200);

    const all = await request(app).get('/api/shop/products/all').set(auth(admin));
    expect(all.body.data.products[0].stock).toBe(3);

    const mine = await request(app).get('/api/shop/orders/my').set(auth(member));
    expect(mine.body.data.orders).toHaveLength(1);
  });
});

describe('Group classes', () => {
  it('coach schedules weekly classes, members join until full, coach checks in', async () => {
    const coach = await registerUser(app, { role: 'coach' });
    const m1 = await registerUser(app);
    const m2 = await registerUser(app);

    const startsAt = new Date(Date.now() + 2 * 86400000).toISOString();
    const created = await request(app).post('/api/classes').set(auth(coach))
      .send({ title: 'Morning HIIT', category: 'hiit', startsAt, capacity: 1, repeatWeeks: 2 });
    expect(created.statusCode).toBe(201);
    expect(created.body.data.classes).toHaveLength(2);
    const id = created.body.data.classes[0]._id;

    expect((await request(app).post(`/api/classes/${id}/join`).set(auth(m1))).statusCode).toBe(200);
    expect((await request(app).post(`/api/classes/${id}/join`).set(auth(m1))).statusCode).toBe(409); // already in
    expect((await request(app).post(`/api/classes/${id}/join`).set(auth(m2))).statusCode).toBe(409); // full

    const list = await request(app).get('/api/classes').set(auth(m2));
    expect(list.body.data.classes.length).toBe(2);

    const att = await request(app).put(`/api/classes/${id}/attendance`).set(auth(coach))
      .send({ userId: m1.user._id, present: true });
    expect(att.statusCode).toBe(200);
    expect(att.body.data.class.attended).toHaveLength(1);

    // a member cannot take attendance
    const bad = await request(app).put(`/api/classes/${id}/attendance`).set(auth(m1))
      .send({ userId: m1.user._id, present: true });
    expect(bad.statusCode).toBe(403);

    expect((await request(app).post(`/api/classes/${id}/leave`).set(auth(m1))).statusCode).toBe(200);
    expect((await request(app).post(`/api/classes/${id}/join`).set(auth(m2))).statusCode).toBe(200);
  });

  it('members cannot create classes', async () => {
    const m = await registerUser(app);
    const res = await request(app).post('/api/classes').set(auth(m))
      .send({ title: 'Nope', startsAt: new Date(Date.now() + 86400000).toISOString() });
    expect(res.statusCode).toBe(403);
  });
});
