'use strict';

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const auth = (u) => ({ Authorization: `Bearer ${u.token}` });
const base = '/api/v1/coach-renas';

describe('Coach Renas — plans', () => {
  it('lists the price list publicly (IQD, 3 tiers, programs, coaching)', async () => {
    const res = await request(app).get(`${base}/plans`);
    expect(res.statusCode).toBe(200);
    const d = res.body.data;
    expect(d.currency).toBe('IQD');
    expect(d.tiers.map((t) => t.key)).toEqual(['training', 'food', 'all']);
    expect(d.tiers[0].prices.m1).toBe(7500);
    expect(d.tiers[2].prices.m12).toBe(159000);
    expect(d.programs.length).toBeGreaterThanOrEqual(3);
    expect(d.coaching.prices.m1).toBeGreaterThan(0);
    expect(d.paymentMethods.find((m) => m.method === 'google_play').configured).toBe(false);
  });
});

describe('Coach Renas — buying and the coach panel', () => {
  it('store rules: app tiers only via store billing, coaching only paid directly', async () => {
    const member = await registerUser(app);
    const bad1 = await request(app).post(`${base}/purchase`).set(auth(member))
      .send({ kind: 'tier', key: 'all', period: 'm1', method: 'zaincash' });
    expect(bad1.statusCode).toBe(400);
    const bad2 = await request(app).post(`${base}/purchase`).set(auth(member))
      .send({ kind: 'coaching', key: 'coaching', period: 'm1', method: 'google_play' });
    expect(bad2.statusCode).toBe(400);
    const okTier = await request(app).post(`${base}/purchase`).set(auth(member))
      .send({ kind: 'tier', key: 'food', period: 'm3', method: 'google_play', storeToken: 'test-token' });
    expect(okTier.statusCode).toBe(201);
    expect(okTier.body.data.subscription.amount).toBe(39000);
    expect(okTier.body.data.subscription.status).toBe('pending');
    expect(okTier.body.data.payment.verified).toBe(false);
  });

  it('client buys coaching by transfer, coach confirms, access opens, check-in + reply', async () => {
    const coach = await registerUser(app, { role: 'coach' });
    const member = await registerUser(app);

    // members cannot open the panel
    const nope = await request(app).get(`${base}/panel/summary`).set(auth(member));
    expect(nope.statusCode).toBe(403);

    const prof = await request(app).put(`${base}/profile`).set(auth(member))
      .send({ goal: 'strength', level: 'beg', days: 3, place: 'gym', kg: 78, cm: 176, age: 24 });
    expect(prof.statusCode).toBe(200);

    const buy = await request(app).post(`${base}/purchase`).set(auth(member))
      .send({ kind: 'coaching', key: 'coaching', period: 'm1', method: 'fib', receiptUrl: '/uploads/receipt.jpg' });
    expect(buy.statusCode).toBe(201);
    expect(buy.body.data.transferAccounts.length).toBe(3);
    expect(buy.body.data.payment.status).toBe('pending');
    const subId = buy.body.data.subscription._id;

    let me = await request(app).get(`${base}/me`).set(auth(member));
    expect(me.body.data.access.coaching).toBe(false);

    const summary = await request(app).get(`${base}/panel/summary`).set(auth(coach));
    expect(summary.statusCode).toBe(200);
    expect(summary.body.data.pendingPayments).toBe(1);

    const pays = await request(app).get(`${base}/panel/payments`).set(auth(coach));
    expect(pays.body.data.payments).toHaveLength(1);

    const ok = await request(app).patch(`${base}/panel/payments/${subId}`).set(auth(coach)).send({ decision: 'approve' });
    expect(ok.statusCode).toBe(200);
    expect(ok.body.data.subscription.status).toBe('active');

    const again = await request(app).patch(`${base}/panel/payments/${subId}`).set(auth(coach)).send({ decision: 'reject' });
    expect(again.statusCode).toBe(409);

    me = await request(app).get(`${base}/me`).set(auth(member));
    expect(me.body.data.access.coaching).toBe(true);
    expect(me.body.data.access.tier).toBe('all');

    const ci = await request(app).post(`${base}/checkins`).set(auth(member))
      .send({ kg: 77.5, sleep: 4, energy: 3, workoutsDone: 3, note: 'Good week' });
    expect(ci.statusCode).toBe(201);

    const clients = await request(app).get(`${base}/panel/clients`).set(auth(coach));
    expect(clients.body.data.clients).toHaveLength(1);
    expect(clients.body.data.clients[0].coaching).toBe(true);
    expect(clients.body.data.clients[0].unanswered).toBe(true);

    const reply = await request(app).post(`${base}/panel/checkins/${ci.body.data.checkIn._id}/reply`).set(auth(coach))
      .send({ reply: 'Great work, add 1 kg next week.' });
    expect(reply.statusCode).toBe(200);

    const mine = await request(app).get(`${base}/checkins/me`).set(auth(member));
    expect(mine.body.data.checkIns[0].reply).toMatch(/Great work/);

    const detail = await request(app).get(`${base}/panel/clients/${member.user._id}`).set(auth(coach));
    expect(detail.statusCode).toBe(200);
    expect(detail.body.data.profile.goal).toBe('strength');
  });

  it('free trial once, gives All-Access for 7 days', async () => {
    const member = await registerUser(app);
    const t = await request(app).post(`${base}/trial`).set(auth(member));
    expect(t.statusCode).toBe(201);
    expect(t.body.data.access.tier).toBe('all');
    const t2 = await request(app).post(`${base}/trial`).set(auth(member));
    expect(t2.statusCode).toBe(409);
  });

  it('content planner seeds the 2-week plan and supports edit/delete', async () => {
    const coach = await registerUser(app, { role: 'coach' });
    const list = await request(app).get(`${base}/panel/content`).set(auth(coach));
    expect(list.body.data.items).toHaveLength(10);
    const id = list.body.data.items[0]._id;
    const upd = await request(app).put(`${base}/panel/content/${id}`).set(auth(coach)).send({ status: 'posted' });
    expect(upd.body.data.item.status).toBe('posted');
    const add = await request(app).post(`${base}/panel/content`).set(auth(coach))
      .send({ pillar: 'discipline', idea: 'One exercise instead of five', format: 'reel' });
    expect(add.statusCode).toBe(201);
    const del = await request(app).delete(`${base}/panel/content/${id}`).set(auth(coach));
    expect(del.statusCode).toBe(200);
  });

  it('a member can delete their own account and Coach Renas data', async () => {
    const member = await registerUser(app);
    await request(app).put(`${base}/profile`).set(auth(member)).send({ goal: 'fat' });
    await request(app).post(`${base}/checkins`).set(auth(member)).send({ kg: 80 });
    const noConfirm = await request(app).delete('/api/users/me').set(auth(member)).send({});
    expect(noConfirm.statusCode).toBe(400);
    const del = await request(app).delete('/api/users/me').set(auth(member)).send({ confirm: 'DELETE' });
    expect(del.statusCode).toBe(200);
    const after = await request(app).get(`${base}/me`).set(auth(member));
    expect(after.statusCode).toBe(401);
  });

  it('COACH_RENAS_COACH_EMAILS limits the panel to listed coaches', async () => {
    const other = await registerUser(app, { role: 'coach' });
    process.env.COACH_RENAS_COACH_EMAILS = 'renas@example.com';
    try {
      const res = await request(app).get(`${base}/panel/summary`).set(auth(other));
      expect(res.statusCode).toBe(403);
    } finally {
      delete process.env.COACH_RENAS_COACH_EMAILS;
    }
  });
});

describe('Coach Renas — shop orders, notifications, store ids', () => {
  it('plans expose store product ids; purchase returns the product id', async () => {
    const res = await request(app).get(`${base}/plans`);
    expect(res.body.data.storeProductIds).toEqual(expect.arrayContaining(['cr_all_m12', 'cr_training_m1', 'cr_prog_fatloss', 'cr_prog_women_home']));
    const member = await registerUser(app);
    const buy = await request(app).post(`${base}/purchase`).set(auth(member))
      .send({ kind: 'tier', key: 'all', period: 'm12', method: 'apple' });
    expect(buy.body.data.productId).toBe('cr_all_m12');
    const bad = await request(app).post(`${base}/purchase`).set(auth(member))
      .send({ kind: 'tier', key: 'nope', period: 'm1', method: 'google_play' });
    expect(bad.statusCode).toBe(400);
  });

  it('member orders from the shop; server computes the total; coach ships it; member is notified', async () => {
    const coach = await registerUser(app, { role: 'coach' });
    const member = await registerUser(app);
    const cat = await request(app).get(`${base}/shop`);
    expect(cat.body.data.products.find((p) => p.key === 'whey').price).toBe(65000);

    const badPhone = await request(app).post(`${base}/orders`).set(auth(member))
      .send({ items: [{ key: 'whey', quantity: 1 }], governorate: 'بغداد', phone: '12345' });
    expect(badPhone.statusCode).toBe(400);
    const badItem = await request(app).post(`${base}/orders`).set(auth(member))
      .send({ items: [{ key: 'gold', quantity: 1 }], governorate: 'بغداد', phone: '07701234567' });
    expect(badItem.statusCode).toBe(400);

    const ok = await request(app).post(`${base}/orders`).set(auth(member))
      .send({ items: [{ key: 'whey', quantity: 1 }, { key: 'shaker', quantity: 2 }], governorate: 'السليمانية', phone: '07701234567' });
    expect(ok.statusCode).toBe(201);
    expect(ok.body.data.order.total).toBe(65000 + 14000 + 5000);

    const summary = await request(app).get(`${base}/panel/summary`).set(auth(coach));
    expect(summary.body.data.pendingOrders).toBe(1);
    const list = await request(app).get(`${base}/panel/orders`).set(auth(coach));
    expect(list.body.data.orders).toHaveLength(1);
    const ship = await request(app).patch(`${base}/panel/orders/${ok.body.data.order._id}`).set(auth(coach)).send({ status: 'shipped' });
    expect(ship.body.data.order.status).toBe('shipped');

    const cancelLate = await request(app).patch(`${base}/orders/${ok.body.data.order._id}/cancel`).set(auth(member));
    expect(cancelLate.statusCode).toBe(409);

    const notes = await request(app).get('/api/notifications').set(auth(member));
    expect(notes.statusCode).toBe(200);
    expect(JSON.stringify(notes.body)).toMatch(/Coach Renas shop: shipped/);
  });

  it('member is notified when the coach confirms a payment and replies to a check-in', async () => {
    const coach = await registerUser(app, { role: 'coach' });
    const member = await registerUser(app);
    const buy = await request(app).post(`${base}/purchase`).set(auth(member))
      .send({ kind: 'coaching', key: 'coaching', period: 'm3', method: 'zaincash' });
    await request(app).patch(`${base}/panel/payments/${buy.body.data.subscription._id}`).set(auth(coach)).send({ decision: 'approve' });
    const ci = await request(app).post(`${base}/checkins`).set(auth(member)).send({ kg: 70 });
    await request(app).post(`${base}/panel/checkins/${ci.body.data.checkIn._id}/reply`).set(auth(coach)).send({ reply: 'Keep going' });
    const notes = await request(app).get('/api/notifications').set(auth(member));
    const txt = JSON.stringify(notes.body);
    expect(txt).toMatch(/payment confirmed/);
    expect(txt).toMatch(/Keep going/);
    // 3 months from now
    const me = await request(app).get(`${base}/me`).set(auth(member));
    const sub = me.body.data.subscriptions.find((s) => s.kind === 'coaching');
    const months = (new Date(sub.endsAt) - new Date(sub.startsAt)) / (30 * 86400000);
    expect(months).toBeGreaterThan(2.9);
    expect(months).toBeLessThan(3.2);
  });

  it('guests cannot buy, order or check in', async () => {
    expect((await request(app).post(`${base}/purchase`).send({})).statusCode).toBe(401);
    expect((await request(app).post(`${base}/orders`).send({})).statusCode).toBe(401);
    expect((await request(app).post(`${base}/checkins`).send({})).statusCode).toBe(401);
  });
});
