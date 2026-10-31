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
