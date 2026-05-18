'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./utils/logger');
const { defaultLimiter } = require('./middlewares/rateLimiter.middleware');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes        = require('./modules/auth/auth.routes');
const userRoutes        = require('./modules/users/users.routes');
const workoutRoutes     = require('./modules/workouts/workouts.routes');
const exerciseRoutes    = require('./modules/exercises/exercises.routes');
const aiRoutes          = require('./modules/ai/ai.routes');
const bookingRoutes     = require('./modules/bookings/bookings.routes');
const paymentRoutes     = require('./modules/payments/payments.routes');
const chatRoutes        = require('./modules/chat/chat.routes');
const notifRoutes       = require('./modules/notifications/notifications.routes');
const progressRoutes    = require('./modules/progress/progress.routes');
const tipRoutes         = require('./modules/tips/tips.routes');
const courseRoutes      = require('./modules/courses/courses.routes');
const anatomyRoutes     = require('./modules/anatomy/anatomy.routes');
const debugRoutes       = require('./modules/debug/debug.routes');
const legacyAuthRoutes  = require('../routes/auth');   // social login (Google/Facebook/Apple)
const uploadRoutes      = require('../routes/upload');
const adminRoutes       = require('../routes/admin');

const app = express();

// ── Security & compression ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.isDev) return cb(null, true);
    if (config.cors.origins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP logging ──────────────────────────────────────────────────────────────
app.use(morgan(config.isDev ? 'dev' : 'combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── Rate limit (global) ───────────────────────────────────────────────────────
if (!config.isDev) app.use(defaultLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  env: config.env,
  timestamp: new Date().toISOString(),
}));

// ── API routes ────────────────────────────────────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`,          authRoutes);
app.use(`${v1}/auth`,          legacyAuthRoutes);  // social: /google, /facebook, /apple
app.use(`${v1}/users`,         userRoutes);
app.use(`${v1}/workouts`,      workoutRoutes);
app.use(`${v1}/exercises`,     exerciseRoutes);
app.use(`${v1}/ai`,            aiRoutes);
app.use(`${v1}/bookings`,      bookingRoutes);
app.use(`${v1}/payments`,      paymentRoutes);
app.use(`${v1}/chat`,          chatRoutes);
app.use(`${v1}/notifications`, notifRoutes);
app.use(`${v1}/progress`,      progressRoutes);
app.use(`${v1}/tips`,          tipRoutes);
app.use(`${v1}/courses`,       courseRoutes);
app.use(`${v1}/anatomy`,       anatomyRoutes);
app.use(`${v1}/debug`,         debugRoutes);
app.use(`${v1}/upload`,        uploadRoutes);
app.use(`${v1}/admin`,         adminRoutes);

// Legacy v0 alias (keeps existing app working during migration)
app.use('/api',                authRoutes);
app.use('/api/auth',           legacyAuthRoutes);  // social login legacy alias
app.use('/api/users',          userRoutes);
app.use('/api/workouts',       workoutRoutes);
app.use('/api/exercises',      exerciseRoutes);
app.use('/api/ai',             aiRoutes);
app.use('/api/bookings',       bookingRoutes);
app.use('/api/chat',           chatRoutes);
app.use('/api/notifications',  notifRoutes);
app.use('/api/progress',       progressRoutes);
app.use('/api/tips',           tipRoutes);
app.use('/api/courses',        courseRoutes);
app.use('/api/anatomy',        anatomyRoutes);
app.use('/api/debug',          debugRoutes);
app.use('/api/payments',       paymentRoutes);
app.use('/api/upload',         uploadRoutes);
app.use('/api/admin',          adminRoutes);

// ── 404 + error handler ───────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
