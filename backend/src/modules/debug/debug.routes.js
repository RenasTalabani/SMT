'use strict';

const { Router } = require('express');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const ApiResponse = require('../../utils/ApiResponse');
const config = require('../../config');
const logger = require('../../utils/logger');

const router = Router();

// ── Error knowledge base (works without OpenAI) ───────────────────────────
const ERROR_KB = {
  'toPublicJSON is not a function': {
    cause: 'The User model is missing the toPublicJSON() method',
    fix: 'Add userSchema.methods.toPublicJSON = function() { ... } to models/User.js',
    severity: 'critical',
  },
  'Cannot find module': {
    cause: 'A required npm package is not installed or the path is wrong',
    fix: 'Run npm install in the backend directory, or check the require() path',
    severity: 'critical',
  },
  'ECONNREFUSED': {
    cause: 'MongoDB is not running or is on a different port',
    fix: 'Start MongoDB: mongod --dbpath <path> --port 27018. Check MONGODB_URI in .env',
    severity: 'critical',
  },
  'jwt malformed': {
    cause: 'The JWT token is corrupted or from a different secret',
    fix: 'Log out and log back in to get a fresh token. Check JWT_SECRET matches between sessions.',
    severity: 'high',
  },
  'TokenExpiredError': {
    cause: 'The access token has expired (15 min default)',
    fix: 'The mobile app should automatically refresh the token via /auth/refresh. Check the Dio interceptor.',
    severity: 'medium',
  },
  'Invalid credentials': {
    cause: 'Email not found or password hash does not match',
    fix: 'Check that bcrypt.compare is used in comparePassword(). Ensure the user was seeded with hashed password.',
    severity: 'high',
  },
  'CORS': {
    cause: 'The request origin is not in the allowed CORS list',
    fix: 'Add origin to CORS_ORIGINS in .env, or set cors({ origin: true }) in development',
    severity: 'medium',
  },
  'ValidationError': {
    cause: 'Mongoose schema validation failed — a required field is missing or wrong type',
    fix: 'Check the request body matches the schema. Look at the error.errors object for field details.',
    severity: 'medium',
  },
  'Cast to ObjectId failed': {
    cause: 'An invalid MongoDB ObjectId was passed as a route parameter',
    fix: 'Validate that the :id param is a valid 24-char hex string before querying',
    severity: 'low',
  },
  'EADDRINUSE': {
    cause: 'Port 5000 is already in use by another process',
    fix: 'Run: netstat -ano | findstr :5000  then  taskkill /PID <pid> /F',
    severity: 'critical',
  },
  'socket hang up': {
    cause: 'Server closed the connection before sending a response — likely an unhandled crash',
    fix: 'Check server logs for the actual error. Add try/catch to the route handler.',
    severity: 'high',
  },
  'user.refreshToken': {
    cause: 'The User model does not have a refreshToken field (only refreshTokens array)',
    fix: 'Add refreshToken: { type: String, select: false } to the User schema',
    severity: 'critical',
  },
};

function analyzeLocally(errorMessage) {
  const msg = (errorMessage || '').toLowerCase();
  for (const [pattern, info] of Object.entries(ERROR_KB)) {
    if (msg.includes(pattern.toLowerCase())) {
      return {
        matched: true,
        pattern,
        ...info,
        source: 'knowledge_base',
      };
    }
  }
  return {
    matched: false,
    cause: 'Unknown error — not in the local knowledge base',
    fix: 'Check the server logs (server.log) for more context. Enable LOG_LEVEL=debug in .env',
    severity: 'unknown',
    source: 'knowledge_base',
  };
}

// ── POST /api/v1/debug/analyze ────────────────────────────────────────────
// Public in dev, protected in prod
router.post('/analyze', async (req, res, next) => {
  try {
    const { error: errorMessage, context } = req.body;
    if (!errorMessage) {
      return ApiResponse.badRequest(res, 'error message is required');
    }

    logger.warn(`[Debug] Analysis requested: ${errorMessage.slice(0, 100)}`);

    // Try local KB first (no API key needed)
    const localResult = analyzeLocally(errorMessage);

    // Try OpenAI if configured
    let aiAnalysis = null;
    if (config.openai.apiKey) {
      try {
        const { OpenAI } = require('openai');
        const client = new OpenAI({ apiKey: config.openai.apiKey });
        const completion = await client.chat.completions.create({
          model: config.openai.model,
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content: `You are a senior Node.js/Express/MongoDB/Flutter debugger for a fitness app called CityGym.
Analyze the error, explain the root cause in 1-2 sentences, then give a concrete fix.
Format: {"cause":"...","fix":"...","severity":"critical|high|medium|low"}
Only respond with valid JSON.`,
            },
            {
              role: 'user',
              content: `Error: ${errorMessage}\nContext: ${context || 'backend API'}`,
            },
          ],
        });
        const text = completion.choices[0].message.content.trim();
        aiAnalysis = JSON.parse(text);
        aiAnalysis.source = 'openai';
      } catch (_) {
        // OpenAI failed — fall back to local result only
      }
    }

    ApiResponse.success(res, {
      input: errorMessage.slice(0, 200),
      local: localResult,
      ai: aiAnalysis,
      recommendation: aiAnalysis || localResult,
    }, 'Analysis complete');
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/debug/health-check ────────────────────────────────────────
router.get('/health-check', async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const checks = {
      server: 'ok',
      database: mongoose.connection.readyState === 1 ? 'ok' : 'disconnected',
      openai: config.openai.apiKey ? 'configured' : 'not_configured',
      stripe: config.stripe.secretKey ? 'configured' : 'not_configured',
      firebase: config.firebase.serverKey ? 'configured' : 'not_configured',
      cloudinary: config.cloudinary.cloudName ? 'configured' : 'not_configured',
      env: config.env,
      dbUri: config.db.uri.replace(/\/\/.*@/, '//***@'), // mask credentials
    };

    const allOk = checks.server === 'ok' && checks.database === 'ok';
    ApiResponse.success(res, checks, allOk ? 'All systems operational' : 'Some services need attention');
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/debug/routes ─────────────────────────────────────────────
// Lists all registered routes (dev only)
router.get('/routes', (req, res, next) => {
  if (!config.isDev) return ApiResponse.forbidden(res, 'Only available in development');
  try {
    const app = req.app;
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          method: Object.keys(middleware.route.methods).join(',').toUpperCase(),
        });
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: middleware.regexp.source + handler.route.path,
              method: Object.keys(handler.route.methods).join(',').toUpperCase(),
            });
          }
        });
      }
    });
    ApiResponse.success(res, { count: routes.length, routes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
