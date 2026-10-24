'use strict';

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const weeklySchedule = Object.fromEntries(
  allDays.map((d) => [d, { enabled: true, slots: [{ startTime: '09:00', endTime: '12:00' }] }]),
);

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
}

describe('Coach availability + booking flow', () => {
  it('coach saves a schedule, client sees slots, books, coach confirms + completes, client rates', async () => {
    const coach = await registerUser(app, { role: 'coach' });
    const client = await registerUser(app, { role: 'client' });

    const save = await request(app)
      .put('/api/bookings/availability')
      .set('Authorization', `Bearer ${coach.token}`)
      .send({ weeklySchedule, sessionDurationMin: 60, bufferMin: 0, sessionPrice: 25 });
    expect(save.statusCode).toBe(200);

    const mine = await request(app)
      .get('/api/bookings/availability/me')
      .set('Authorization', `Bearer ${coach.token}`);
    expect(mine.body.data.availability.sessionPrice).toBe(25);

    const from = new Date(Date.now() - 5 * 1000); // a phone's "now", already slightly in the past
    const to = new Date(Date.now() + 3 * 86400000);
    const slots = await request(app)
      .get('/api/bookings/slots')
      .query({ coachId: coach.user._id, from: from.toISOString(), to: to.toISOString() });
    expect(slots.statusCode).toBe(200);
    expect(slots.body.data.slots.length).toBeGreaterThan(0);

    const day = tomorrow();
    const book = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ coachId: coach.user._id, date: day.toISOString(), startTime: '09:00', endTime: '10:00' });
    expect(book.statusCode).toBe(201);
    const bookingId = book.body.data.booking._id;
    expect(book.body.data.booking.price).toBe(25);

    // Same slot again → conflict
    const again = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ coachId: coach.user._id, date: day.toISOString(), startTime: '09:00', endTime: '10:00' });
    expect(again.statusCode).toBe(409);

    // Client may not confirm their own booking
    const selfConfirm = await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${client.token}`)
      .send({ status: 'confirmed' });
    expect(selfConfirm.statusCode).toBe(403);

    // Coach confirms then completes (this used to always fail: ObjectId vs string compare)
    for (const status of ['confirmed', 'completed']) {
      const r = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${coach.token}`)
        .send({ status });
      expect(r.statusCode).toBe(200);
      expect(r.body.data.booking.status).toBe(status);
    }

    const rate = await request(app)
      .post(`/api/bookings/${bookingId}/rate`)
      .set('Authorization', `Bearer ${client.token}`)
      .send({ score: 5, review: 'Great session' });
    expect(rate.statusCode).toBe(200);

    const coachList = await request(app)
      .get('/api/bookings/coach')
      .set('Authorization', `Bearer ${coach.token}`);
    expect(coachList.statusCode).toBe(200);
  });

  it('rejects a booking outside the coach schedule', async () => {
    const coach = await registerUser(app, { role: 'coach' });
    const client = await registerUser(app, { role: 'client' });
    await request(app)
      .put('/api/bookings/availability')
      .set('Authorization', `Bearer ${coach.token}`)
      .send({ weeklySchedule, sessionDurationMin: 60, bufferMin: 0 });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ coachId: coach.user._id, date: tomorrow().toISOString(), startTime: '22:00', endTime: '23:00' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects booking a non-coach', async () => {
    const other = await registerUser(app, { role: 'client' });
    const client = await registerUser(app, { role: 'client' });
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ coachId: other.user._id, date: tomorrow().toISOString(), startTime: '09:00', endTime: '10:00' });
    expect(res.statusCode).toBe(404);
  });

  it('only coaches can publish a schedule', async () => {
    const client = await registerUser(app, { role: 'client' });
    const res = await request(app)
      .put('/api/bookings/availability')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ weeklySchedule });
    expect(res.statusCode).toBe(403);
  });
});
