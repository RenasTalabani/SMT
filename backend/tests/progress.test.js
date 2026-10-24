'use strict';

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');
const Progress = require('../models/Progress');

let u;
beforeAll(async () => {
  await db.connect();
  u = await registerUser(app);
});
afterAll(db.close);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

describe('Progress stats', () => {
  it('counts workouts, streak, calories and weight change from real fields', async () => {
    const base = { user: u.user._id };
    await Progress.create([
      { ...base, type: 'workout_completion', date: daysAgo(3), workoutData: { duration: 40, caloriesBurned: 300 }, metrics: { mood: 'good', energy: 'high' } },
      { ...base, type: 'workout_completion', date: daysAgo(2), workoutData: { duration: 50, caloriesBurned: 350 }, metrics: { mood: 'excellent', energy: 'very_high' } },
      { ...base, type: 'workout_completion', date: daysAgo(1), workoutData: { duration: 30, caloriesBurned: 200 } },
      { ...base, type: 'body_measurement', date: daysAgo(10), measurements: { weight: 82 } },
      { ...base, type: 'body_measurement', date: daysAgo(1), measurements: { weight: 80.5 } },
    ]);

    const res = await request(app).get('/api/progress/stats/overview').set('Authorization', `Bearer ${u.token}`);
    expect(res.statusCode).toBe(200);
    const s = res.body.data.stats;
    expect(s.totalWorkouts).toBe(3);
    expect(s.totalDuration).toBe(120);
    expect(s.totalCalories).toBe(850);
    expect(s.workoutStreak).toBe(3);
    expect(s.weightChange).toBe(-1.5);
    expect(s.averageMood).toBe(3.5);
    expect(s.measurementsCount).toBe(2);
  });
});
