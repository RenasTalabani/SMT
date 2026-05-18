'use strict';

const config = require('../../config');
const { AppError } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger');

let _openai = null;

function getOpenAI() {
  if (!config.openai.apiKey) {
    throw new AppError('AI service not configured. Please contact support.', 503);
  }
  if (!_openai) {
    const { default: OpenAI } = require('openai'); // lazy
    _openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return _openai;
}

async function chat(messages, systemPrompt, maxTokens = 500) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0].message.content;
}

async function sendChatMessage(userId, userMessage, history = []) {
  const systemPrompt = `You are an expert gym coach and personal trainer named Alex.
You specialize in fitness, nutrition, and motivation.
Keep responses concise (under 150 words), practical, and encouraging.
Always personalize advice when you have context about the user.`;

  const messages = [
    ...history.slice(-10).map((m) => ({ role: m.isUser ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: userMessage },
  ];

  try {
    return await chat(messages, systemPrompt, 300);
  } catch (err) {
    logger.error('AI chat error:', err.message);
    throw new AppError('AI service temporarily unavailable', 503);
  }
}

async function generateWorkout({ goal, level, daysPerWeek, equipment = 'any', restrictions = '' }) {
  const systemPrompt = `You are an expert personal trainer. Generate structured workout plans in valid JSON only.
No markdown, no explanation, pure JSON.`;

  const prompt = `Create a ${daysPerWeek}-day/week workout plan for a ${level} with goal: ${goal}.
Equipment: ${equipment}. Restrictions: ${restrictions || 'none'}.
Return JSON: { "title": "", "description": "", "days": [{ "day": 1, "name": "", "exercises": [{ "name": "", "sets": 0, "reps": "", "restSeconds": 0, "notes": "" }] }] }`;

  try {
    const raw = await chat([{ role: 'user', content: prompt }], systemPrompt, 1200);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    logger.error('Workout generation error:', err.message);
    throw new AppError('Failed to generate workout plan', 503);
  }
}

async function generateNutritionPlan({ weight, height, age, gender, goal, activityLevel }) {
  const bmr = gender === 'female'
    ? 447.6 + (9.25 * weight) + (3.1 * height) - (4.33 * (age || 25))
    : 88.36 + (13.4 * weight) + (4.8 * height) - (5.68 * (age || 25));

  const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));

  const systemPrompt = 'You are a certified nutritionist. Provide concise, practical nutrition plans.';
  const prompt = `Create a nutrition plan for: weight ${weight}kg, height ${height}cm, age ${age}, gender ${gender}, goal: ${goal}, TDEE: ${tdee} kcal.
Include: daily calorie target, macros (protein/carbs/fats in grams), 3 meal examples, 3 practical tips. Keep under 400 words.`;

  try {
    const plan = await chat([{ role: 'user', content: prompt }], systemPrompt, 600);
    return { plan, tdee, bmr: Math.round(bmr) };
  } catch (err) {
    logger.error('Nutrition plan error:', err.message);
    throw new AppError('Failed to generate nutrition plan', 503);
  }
}

async function analyzeProgress(progressData) {
  const systemPrompt = 'You are a data-driven fitness coach. Analyze workout data and give actionable insights.';
  const prompt = `Analyze this fitness data and give 3-5 specific recommendations:
${JSON.stringify(progressData, null, 2)}
Format response as JSON: { "analysis": "2-3 sentence summary", "suggestions": ["tip1", "tip2", "tip3"] }`;

  try {
    const raw = await chat([{ role: 'user', content: prompt }], systemPrompt, 500);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    logger.error('Progress analysis error:', err.message);
    return {
      analysis: 'Keep up the great work! Consistency is the key to long-term results.',
      suggestions: [
        'Track your workouts 3+ times per week for best results',
        'Ensure you are getting 7-9 hours of sleep for recovery',
        'Stay hydrated — drink at least 8 glasses of water daily',
      ],
    };
  }
}

async function getDailyTip() {
  const fallbacks = [
    'Consistency beats perfection. Show up today, even for 20 minutes.',
    'Progressive overload: increase weight or reps each week to keep growing.',
    'Rest days are growth days. Your muscles rebuild during recovery.',
    'Protein at every meal — aim for 0.8-1g per pound of bodyweight.',
    'Compound movements (squat, deadlift, press) give the most return per minute.',
  ];

  try {
    const systemPrompt = 'You are a motivational fitness coach.';
    const prompt = 'Give one powerful, practical fitness tip in exactly 1-2 sentences. No fluff.';
    return await chat([{ role: 'user', content: prompt }], systemPrompt, 80);
  } catch {
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

module.exports = { sendChatMessage, generateWorkout, generateNutritionPlan, analyzeProgress, getDailyTip };
