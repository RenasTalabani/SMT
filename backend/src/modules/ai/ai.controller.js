'use strict';

const service = require('./ai.service');
const ApiResponse = require('../../utils/ApiResponse');

const chatMessage = async (req, res, next) => {
  try {
    const reply = await service.sendChatMessage(req.user._id, req.body.message, req.body.history || []);
    ApiResponse.success(res, { reply });
  } catch (err) { next(err); }
};

const generateWorkout = async (req, res, next) => {
  try {
    const plan = await service.generateWorkout(req.body);
    ApiResponse.success(res, { plan }, 'Workout plan generated');
  } catch (err) { next(err); }
};

const nutritionPlan = async (req, res, next) => {
  try {
    const result = await service.generateNutritionPlan(req.body);
    ApiResponse.success(res, result, 'Nutrition plan generated');
  } catch (err) { next(err); }
};

const analyzeProgress = async (req, res, next) => {
  try {
    const result = await service.analyzeProgress(req.body.progressData || {});
    ApiResponse.success(res, result, 'Progress analyzed');
  } catch (err) { next(err); }
};

const dailyTip = async (req, res, next) => {
  try {
    const tip = await service.getDailyTip();
    ApiResponse.success(res, { tip });
  } catch (err) { next(err); }
};

module.exports = { chatMessage, generateWorkout, nutritionPlan, analyzeProgress, dailyTip };
