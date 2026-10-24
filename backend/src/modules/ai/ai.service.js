'use strict';

const config = require('../../config');
const logger = require('../../utils/logger');
const fallback = require('./ai.fallback');

let _openai = null;

// Returns an OpenAI client, or null when no key is configured.
function getOpenAI() {
  if (!config.openai.apiKey) return null;
  if (!_openai) {
    const { default: OpenAI } = require('openai'); // lazy
    _openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return _openai;
}

function aiEnabled() {
  return Boolean(config.openai.apiKey);
}

async function chat(messages, systemPrompt, maxTokens = 500) {
  const openai = getOpenAI();
  if (!openai) throw new Error('OPENAI_API_KEY not configured');
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

  if (!aiEnabled()) return fallback.chatReply(userMessage);
  try {
    return await chat(messages, systemPrompt, 300);
  } catch (err) {
    logger.error('AI chat error:', err.message);
    return fallback.chatReply(userMessage);
  }
}

async function generateWorkout(input) {
  const { goal, level, daysPerWeek, equipment = 'any', restrictions = '' } = input;
  if (!aiEnabled()) return fallback.generateWorkout(input);

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
    return fallback.generateWorkout(input);
  }
}

async function generateNutritionPlan(input) {
  const base = fallback.nutrition(input); // exact numbers are always computed locally
  if (!aiEnabled()) return base;

  const { weight, height, age, gender, goal } = input;
  const systemPrompt = 'You are a certified nutritionist. Provide concise, practical nutrition plans.';
  const prompt = `Create a nutrition plan for: weight ${weight}kg, height ${height}cm, age ${age}, gender ${gender}, goal: ${goal}, TDEE: ${base.tdee} kcal, target ${base.calories} kcal, macros P${base.macros.protein}/C${base.macros.carbs}/F${base.macros.fats} g.
Include: daily calorie target, macros (protein/carbs/fats in grams), 3 meal examples, 3 practical tips. Keep under 400 words.`;

  try {
    const plan = await chat([{ role: 'user', content: prompt }], systemPrompt, 600);
    return { ...base, plan, source: 'openai' };
  } catch (err) {
    logger.error('Nutrition plan error:', err.message);
    return base;
  }
}

async function analyzeProgress(progressData) {
  if (!aiEnabled()) return fallback.analyzeProgress(progressData);
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
    return fallback.analyzeProgress(progressData);
  }
}

async function getDailyTip() {
  const fallbacks = [
    'Consistency beats perfection. Show up today, even for 20 minutes.',
    'Progressive overload: increase weight or reps each week to keep growing.',
    'Rest days are growth days. Your muscles rebuild during recovery.',
    'Protein at every meal — aim for 1.6-2.2 g per kg of bodyweight.',
    'Compound movements (squat, deadlift, press) give the most return per minute.',
  ];
  const pick = () => fallbacks[Math.floor(Math.random() * fallbacks.length)];
  if (!aiEnabled()) return pick();

  try {
    const systemPrompt = 'You are a motivational fitness coach.';
    const prompt = 'Give one powerful, practical fitness tip in exactly 1-2 sentences. No fluff.';
    return await chat([{ role: 'user', content: prompt }], systemPrompt, 80);
  } catch {
    return pick();
  }
}

module.exports = { sendChatMessage, generateWorkout, generateNutritionPlan, analyzeProgress, getDailyTip, aiEnabled };
