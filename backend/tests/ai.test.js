'use strict';

// The AI coach must work with NO OpenAI key (built-in coach engine).
delete process.env.OPENAI_API_KEY;

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');
const fallback = require('../src/modules/ai/ai.fallback');

let token;
beforeAll(async () => {
  await db.connect();
  ({ token } = await registerUser(app));
});
afterAll(db.close);

const post = (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body);
const get = (url) => request(app).get(url).set('Authorization', `Bearer ${token}`);

describe('AI coach without an OpenAI key', () => {
  it('chat replies and keeps history', async () => {
    const res = await post('/api/ai/chat', { message: 'How much protein should I eat?' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.reply).toMatch(/protein/i);
    const hist = await get('/api/ai/chat/history');
    expect(hist.body.data.messages.length).toBe(2);
  });

  it('generates and saves a workout plan', async () => {
    const res = await post('/api/ai/generate-workout', { goal: 'muscle gain', level: 'intermediate', daysPerWeek: 4 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.plan._id).toBeTruthy();
    expect(res.body.data.plan.workouts.length).toBe(4);
    const mine = await get('/api/workouts');
    expect(mine.statusCode).toBe(200);
  });

  it('nutrition plan returns exact calories + macros', async () => {
    const res = await post('/api/ai/nutrition', { weight: 80, height: 180, age: 30, goal: 'weight loss', activityLevel: 'moderate' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.plan).toMatch(/kcal/);
    expect(res.body.data.macros.protein).toBeGreaterThan(100);
  });

  it('analyzes progress, gives insights and a daily tip', async () => {
    expect((await post('/api/ai/analyze-progress', {})).statusCode).toBe(200);
    const insight = await get('/api/ai/insights');
    expect(insight.statusCode).toBe(200);
    expect(insight.body.data.motivation).toBeTruthy();
    const tip = await get('/api/ai/daily-tip');
    expect(tip.statusCode).toBe(200);
  });

  it('form tips work for any exercise', async () => {
    const res = await post('/api/ai/analyze-video', { exerciseName: 'Squat' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.feedback).toMatch(/Squat/);
  });

  it('requires sign-in', async () => {
    const res = await request(app).post('/api/ai/chat').send({ message: 'hi' });
    expect(res.statusCode).toBe(401);
  });
});

describe('built-in engine', () => {
  it('home workouts swap to bodyweight moves', () => {
    const p = fallback.generateWorkout({ goal: 'muscle', level: 'beginner', daysPerWeek: 3, equipment: 'none' });
    const names = p.days.flatMap((d) => d.exercises.map((e) => e.name));
    expect(names).toContain('Push-up');
    expect(names).not.toContain('Barbell Bench Press');
  });

  it('fat-loss calories are below maintenance', () => {
    const n = fallback.nutrition({ weight: 90, height: 175, age: 35, goal: 'lose fat' });
    expect(n.calories).toBe(n.tdee - 500);
  });
});
