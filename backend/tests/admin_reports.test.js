'use strict';

// Admin dashboard / content / analytics used to answer 500 when a course, tip or
// workout plan had no likes / comments / enrolled students / workouts arrays
// (old records, or queries that .select() only some fields).
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const db = require('./helpers/db');
const { registerUser } = require('./helpers/users');
const Course = require('../models/Course');
const Tip = require('../models/Tip');
const WorkoutPlan = require('../models/WorkoutPlan');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const auth = (u) => ({ Authorization: `Bearer ${u.token}` });

describe('Admin reports with sparse records', () => {
  it('dashboard, content and every analytics report answer 200', async () => {
    const admin = await registerUser(app, { role: 'admin' });
    const id = new mongoose.Types.ObjectId();
    // Insert raw documents WITHOUT the array fields, like old data in the database.
    await Course.collection.insertOne({ title: 'Old course', isActive: true, isPublished: true, price: 50000, category: 'yoga', level: 'beginner', instructor: id, createdAt: new Date() });
    await Tip.collection.insertOne({ title: 'Old tip', content: 'x', isActive: true, isPublished: true, category: 'nutrition', type: 'tip', author: id, createdAt: new Date() });
    await WorkoutPlan.collection.insertOne({ name: 'Old plan', isActive: true, createdBy: id, createdAt: new Date() });
    await WorkoutPlan.collection.insertOne({ name: 'Assigned plan', isActive: true, createdBy: id, assignedTo: new mongoose.Types.ObjectId(), createdAt: new Date() });

    const urls = [
      '/api/admin/dashboard/stats',
      '/api/admin/content?type=courses&limit=50',
      '/api/admin/content?type=tips&limit=50',
      '/api/admin/analytics?period=30',
      '/api/admin/analytics/users?period=30',
      '/api/admin/analytics/courses?period=30',
      '/api/admin/analytics/tips?period=30',
      '/api/admin/analytics/workouts?period=30',
      '/api/admin/analytics/revenue?period=30',
    ];
    for (const url of urls) {
      const res = await request(app).get(url).set(auth(admin));
      expect({ url, status: res.statusCode }).toEqual({ url, status: 200 });
    }
  });

  it('counts a course student as completed only when completedAt is set', async () => {
    const admin = await registerUser(app, { role: 'admin' });
    const instructor = new mongoose.Types.ObjectId();
    await Course.collection.insertOne({
      title: 'C', isActive: true, isPublished: true, price: 1, category: 'yoga', level: 'beginner', instructor, createdAt: new Date(),
      enrolledStudents: [
        { student: new mongoose.Types.ObjectId(), enrolledAt: new Date(), completedAt: new Date() },
        { student: new mongoose.Types.ObjectId(), enrolledAt: new Date(), completedAt: null },
        { student: new mongoose.Types.ObjectId(), enrolledAt: new Date() },
      ],
    });
    const res = await request(app).get('/api/admin/analytics/courses?period=30').set(auth(admin));
    expect(res.statusCode).toBe(200);
    expect(res.body.data.overview.totalEnrollments).toBe(3);
    expect(res.body.data.overview.completionRate).toBeCloseTo(33.3, 1);
  });
});
