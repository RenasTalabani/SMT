'use strict';

const { Router } = require('express');
const ctrl = require('./ai.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { aiLimiter } = require('../../middlewares/rateLimiter.middleware');

const router = Router();

router.use(protect, aiLimiter);

router.post('/ai/chat',              ctrl.chatMessage);
router.post('/ai/generate-workout',  ctrl.generateWorkout);
router.post('/ai/nutrition',         ctrl.nutritionPlan);
router.post('/ai/analyze-progress',  ctrl.analyzeProgress);
router.get ('/ai/daily-tip',         ctrl.dailyTip);

module.exports = router;
