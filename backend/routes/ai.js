/**
 * routes/ai.js
 *
 * AI endpoints — chat, workout generation, nutrition, progress analysis,
 * user profile management, daily tips, coaching insights, and behavior tracking.
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const Progress   = require('../models/Progress');
const WorkoutPlan = require('../models/WorkoutPlan');
const AiChat     = require('../models/AiChat');
const AiUserProfile = require('../models/AiUserProfile');
const User       = require('../models/User');
const { protect } = require('../middlewares/auth');
const {
  buildEnrichedSystemPrompt,
  generateCoachInsight,
  generateDailyTip,
  generateChatResponse
} = require('../services/aiCoachService');
const {
  getOrCreateProfile,
  trackWorkoutCompleted,
  trackWorkoutSkipped,
  updateUserContext,
  refreshInactivityStatus
} = require('../services/aiBehaviorTracker');
const {
  generateRecommendation,
  getDailyTip,
  processWorkoutMilestone
} = require('../services/aiRecommendationEngine');

const router = express.Router();

// ── Lazy-init OpenAI (used only in routes that call AI directly) ──────────────
const OpenAI = require('openai');
let openai = null;
function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OPENAI_API_KEY is not configured in .env');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// ── Per-user rate limiter (20 AI requests / 10 min) ──────────────────────────
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Too many AI requests. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Built-in coach engine (works with no OpenAI key) ────────────────────────
const fallback = require('../src/modules/ai/ai.fallback');

function repsToNumber(reps) {
  const nums = String(reps).match(/\d+/g);
  if (!nums) return 12;
  const avg = Math.round(nums.map(Number).reduce((a, b) => a + b, 0) / nums.length);
  return Math.min(Math.max(avg, 1), 100);
}

// Converts the fallback engine's plan into this route's plan JSON shape.
function builtInPlan(goal, level, days, restrictions) {
  const p = fallback.generateWorkout({ goal, level, daysPerWeek: days, restrictions });
  const g = fallback.normalizeGoal(goal);
  const category = { weight_loss: 'weight_loss', muscle_gain: 'muscle_gain', strength: 'strength', endurance: 'endurance' }[g] || 'mixed';
  return {
    title: p.title,
    description: p.description,
    difficulty: level,
    category,
    durationWeeks: 8,
    frequency: days,
    workouts: p.days.map((d) => ({
      day: d.day,
      name: d.name,
      estimatedDuration: 45 + (d.exercises.length > 4 ? 10 : 0),
      warmUp: '5-10 min easy cardio + dynamic stretches',
      coolDown: '5 min walk + light stretching',
      exercises: d.exercises.map((e) => ({
        name: e.name,
        sets: Math.min(Math.max(e.sets, 1), 10),
        reps: repsToNumber(e.reps),
        weight: 0,
        restTime: e.restSeconds,
        notes: `Target: ${e.reps}${e.muscle ? ' · ' + e.muscle : ''}${e.notes ? ' — ' + e.notes : ''}`,
      })),
    })),
    source: 'built-in',
  };
}

// ── Shared error helper ───────────────────────────────────────────────────────
function aiError(res, error) {
  console.error('AI error:', error.message);
  const isKeyError = error.message.includes('OPENAI_API_KEY') ||
                     error.message.includes('not configured');
  return res.status(isKeyError ? 503 : 500).json({
    success: false,
    message: isKeyError
      ? 'AI service not configured. Contact support.'
      : 'AI service temporarily unavailable. Please try again.'
  });
}

// ════════════════════════════════════════════════════════════════════════════
// PROFILE — GET / PUT
// ════════════════════════════════════════════════════════════════════════════

// GET /api/ai/profile — return the user's AiUserProfile (create if missing)
router.get('/profile', protect, async (req, res) => {
  try {
    await refreshInactivityStatus(req.user._id);
    const profile = await getOrCreateProfile(req.user._id);
    res.json({ success: true, data: { profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load AI profile.' });
  }
});

// PUT /api/ai/profile/context — update user context (injuries, preferences…)
router.put('/profile/context', protect, async (req, res) => {
  try {
    const { goals, injuries, preferredExercises, weakPoints } = req.body;
    const profile = await updateUserContext(req.user._id, {
      goals, injuries, preferredExercises, weakPoints
    });
    res.json({ success: true, data: { profile }, message: 'Profile context updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not update profile context.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// BEHAVIOR TRACKING
// ════════════════════════════════════════════════════════════════════════════

// POST /api/ai/track-workout — track a workout completion or skip
router.post('/track-workout', protect, async (req, res) => {
  try {
    const { event } = req.body; // 'completed' | 'skipped'
    if (!['completed', 'skipped'].includes(event)) {
      return res.status(400).json({ success: false, message: "event must be 'completed' or 'skipped'" });
    }

    let profile;
    if (event === 'completed') {
      profile = await trackWorkoutCompleted(req.user._id);
      // Fire milestone notification asynchronously (non-blocking)
      processWorkoutMilestone(req.user._id).catch(() => {});
    } else {
      profile = await trackWorkoutSkipped(req.user._id);
    }

    res.json({
      success: true,
      data: {
        streak: profile.trainingConsistency.currentStreak,
        weeklyRate: profile.trainingConsistency.weeklyRate,
        coachingLevel: profile.coachingLevel,
        behavior: profile.behavior
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not track workout event.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// DAILY TIP
// ════════════════════════════════════════════════════════════════════════════

// GET /api/ai/daily-tip — return today's personalised tip (cached per day)
router.get('/daily-tip', protect, aiLimiter, async (req, res) => {
  try {
    const result = await getDailyTip(req.user._id);
    if (!result) {
      // Fallback if profile or AI not available
      return res.json({
        success: true,
        data: { tip: 'Stay consistent — small daily progress leads to massive results.', cached: true }
      });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    aiError(res, error);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// COACHING INSIGHTS
// ════════════════════════════════════════════════════════════════════════════

// GET /api/ai/insights — personalised weekly coaching insight
router.get('/insights', protect, aiLimiter, async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    await refreshInactivityStatus(req.user._id);

    const insight = await generateCoachInsight(req.user, profile);
    res.json({ success: true, data: insight });
  } catch (error) {
    aiError(res, error);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS
// ════════════════════════════════════════════════════════════════════════════

// GET /api/ai/recommendations — return the last 5 stored recommendations
router.get('/recommendations', protect, async (req, res) => {
  try {
    const profile = await AiUserProfile.findOne({ userId: req.user._id })
      .select('lastRecommendations behavior coachingLevel');
    res.json({
      success: true,
      data: {
        recommendations: profile?.lastRecommendations ?? [],
        coachingLevel:   profile?.coachingLevel ?? 'moderate',
        behavior:        profile?.behavior ?? {}
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load recommendations.' });
  }
});

// POST /api/ai/recommendations/generate — on-demand recommendation (app open trigger)
router.post('/recommendations/generate', protect, aiLimiter, async (req, res) => {
  try {
    const { trigger = 'app_open' } = req.body;
    const validTriggers = ['app_open', 'inactive', 'all_completed', 'weekly_check'];
    if (!validTriggers.includes(trigger)) {
      return res.status(400).json({ success: false, message: 'Invalid trigger' });
    }

    const insight = await generateRecommendation(req.user._id, trigger);
    if (!insight) {
      return res.status(503).json({ success: false, message: 'Could not generate recommendation.' });
    }
    res.json({ success: true, data: insight });
  } catch (error) {
    aiError(res, error);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// CHAT  (upgraded — uses AiUserProfile for enriched context)
// ════════════════════════════════════════════════════════════════════════════

// GET /api/ai/chat/history
router.get('/chat/history', protect, async (req, res) => {
  try {
    const chat = await AiChat.findOne({ userId: req.user._id }).lean();
    const messages = chat ? chat.messages.slice(-40) : [];
    res.json({ success: true, data: { messages } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load chat history.' });
  }
});

// POST /api/ai/chat
router.post('/chat', protect, aiLimiter, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Message too long (max 1000 chars)' });
    }

    const userId = req.user._id;

    // Load chat record + AI profile in parallel
    const [chatRecord_, profile] = await Promise.all([
      AiChat.findOne({ userId }),
      AiUserProfile.findOne({ userId })
    ]);
    const chatRecord = chatRecord_ || new AiChat({ userId, messages: [] });

    // Build OpenAI history from DB (last 20 messages)
    const history = chatRecord.getHistory(20);

    // Save user message
    chatRecord.addMessage('user', message.trim());

    // Generate response using enriched prompt (profile may be null — still works)
    const reply = await generateChatResponse(message.trim(), history, req.user, profile);

    // Save AI reply
    chatRecord.addMessage('assistant', reply);
    await chatRecord.save();

    res.json({ success: true, data: { reply } });
  } catch (error) {
    aiError(res, error);
  }
});

// DELETE /api/ai/chat/history
router.delete('/chat/history', protect, async (req, res) => {
  try {
    await AiChat.findOneAndUpdate(
      { userId: req.user._id },
      { messages: [] },
      { upsert: true }
    );
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not clear history.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// WORKOUT GENERATION
// ════════════════════════════════════════════════════════════════════════════

router.post('/generate-workout', protect, aiLimiter, async (req, res) => {
  try {
    const { goal, level, daysPerWeek } = req.body;

    if (!goal || !level || !daysPerWeek) {
      return res.status(400).json({ success: false, message: 'goal, level, and daysPerWeek are required' });
    }
    const days = parseInt(daysPerWeek, 10);
    if (isNaN(days) || days < 1 || days > 7) {
      return res.status(400).json({ success: false, message: 'daysPerWeek must be between 1 and 7' });
    }

    const validGoals  = ['muscle gain', 'fat loss', 'strength', 'endurance', 'general fitness'];
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validGoals.includes(goal))   return res.status(400).json({ success: false, message: 'Invalid goal' });
    if (!validLevels.includes(level)) return res.status(400).json({ success: false, message: 'Invalid level' });

    // Enrich prompt with user stats + AI profile
    const profile    = await AiUserProfile.findOne({ userId: req.user._id });
    const profileCtx = profile?.injuries?.length
      ? `Note injuries/limitations: ${profile.injuries.join(', ')}.`
      : '';
    const userCtx = req.user?.weight
      ? `Client stats: ${req.user.weight}kg, ${req.user.height || '?'}cm, ${req.user.experienceLevel || level} level. ${profileCtx}`
      : profileCtx;

    const prompt = `Create a ${days}-day/week workout plan for a ${level} aiming for ${goal}. ${userCtx}

Return ONLY valid JSON (no markdown):
{
  "title": "Plan title",
  "description": "Short description",
  "difficulty": "${level}",
  "category": "strength|cardio|mixed|weight_loss|muscle_gain|endurance",
  "durationWeeks": 8,
  "frequency": ${days},
  "workouts": [
    {
      "day": 1,
      "name": "Day name",
      "estimatedDuration": 45,
      "exercises": [
        { "name": "Exercise", "sets": 3, "reps": 12, "weight": 0, "restTime": 60, "notes": "Form tip" }
      ],
      "warmUp": "5 min warm-up",
      "coolDown": "5 min cool-down"
    }
  ]
}
Include ${days} workout days, 4-6 exercises each. weight=0 means bodyweight.`;

    let planData = null;
    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional fitness coach. Output ONLY valid JSON, never wrap in markdown.' },
          { role: 'user',   content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });
      const rawText = response.choices[0].message.content.trim()
        .replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
      planData = JSON.parse(rawText);
    } catch (err) {
      // No OpenAI key, OpenAI down, or bad JSON → use the built-in coach engine.
      planData = builtInPlan(goal, level, days, profile?.injuries?.join(', '));
    }

    const savedPlan = await WorkoutPlan.create({
      title:         planData.title       || `${goal} Plan`,
      description:   planData.description || '',
      difficulty:    planData.difficulty  || level,
      category:      planData.category    || 'mixed',
      duration:      planData.durationWeeks || 8,
      frequency:     planData.frequency   || days,
      createdBy:     req.user._id,
      assignedTo:    req.user._id,
      isTemplate:    false,
      status:        'active',
      workouts: (planData.workouts || []).map(day => ({
        day:               day.day,
        name:              day.name || `Day ${day.day}`,
        estimatedDuration: day.estimatedDuration || 45,
        warmUp:            day.warmUp   || '',
        coolDown:          day.coolDown || '',
        exercises: (day.exercises || []).map((ex, i) => ({
          name:     String(ex.name || `Exercise ${i + 1}`).slice(0, 100),
          sets:     Math.min(Math.max(parseInt(ex.sets, 10) || 3, 1), 10),
          reps:     Math.min(Math.max(parseInt(ex.reps, 10) || 12, 1), 100),
          weight:   Math.max(Number(ex.weight) || 0, 0),
          restTime: Math.min(Math.max(parseInt(ex.restTime, 10) || 60, 0), 600),
          notes:    String(ex.notes || '').slice(0, 200),
          order:    i
        }))
      }))
    });

    res.json({
      success: true,
      data:    { plan: savedPlan, raw: planData },
      message: 'Workout plan generated successfully'
    });
  } catch (error) {
    aiError(res, error);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// NUTRITION
// ════════════════════════════════════════════════════════════════════════════

router.post('/nutrition', protect, aiLimiter, async (req, res) => {
  try {
    const { weight, height, goal, age, gender = 'male', activityLevel = 'moderate' } = req.body;

    if (!weight || !height || !goal) {
      return res.status(400).json({ success: false, message: 'weight, height, and goal are required' });
    }
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || w < 20 || w > 500) return res.status(400).json({ success: false, message: 'Invalid weight' });
    if (isNaN(h) || h < 50 || h > 300) return res.status(400).json({ success: false, message: 'Invalid height' });

    const validGoals      = ['weight loss', 'muscle gain', 'maintenance', 'bulking', 'cutting', 'general health'];
    const validActivities = ['sedentary', 'light', 'moderate', 'active', 'very active'];
    if (!validGoals.includes(goal))           return res.status(400).json({ success: false, message: 'Invalid goal' });
    if (!validActivities.includes(activityLevel)) return res.status(400).json({ success: false, message: 'Invalid activity level' });

    const profile = await AiUserProfile.findOne({ userId: req.user._id });

    const prompt = `Nutrition plan for:
- Weight: ${w} kg, Height: ${h} cm
- Age: ${age || 'not specified'}, Gender: ${gender}
- Goal: ${goal}, Activity: ${activityLevel}

Include:
1. 🔥 Daily calories
2. 💪 Macros (protein/carbs/fats g)
3. ⏰ Meal timing (brief)
4. ✅ Best 3 foods to eat
5. ❌ 3 foods to avoid
6. 💡 One key tip

Be practical and concise. Use emoji section headers.`;

    const numbers = fallback.nutrition({
      weight: w, height: h, age, gender,
      goal: /loss|cut/.test(goal) ? 'weight_loss' : /gain|bulk/.test(goal) ? 'muscle_gain' : 'general_fitness',
      activityLevel: activityLevel.replace(' ', '_'),
    });

    let plan;
    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: buildEnrichedSystemPrompt(req.user, profile) },
          { role: 'user',   content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.6,
      });
      plan = response.choices[0].message.content.trim();
    } catch {
      plan = numbers.plan; // built-in nutrition calculator
    }
    res.json({
      success: true,
      data: { plan, calories: numbers.calories, tdee: numbers.tdee, bmr: numbers.bmr, macros: numbers.macros },
    });
  } catch (error) {
    aiError(res, error);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PROGRESS ANALYSIS
// ════════════════════════════════════════════════════════════════════════════

router.post('/analyze-progress', protect, aiLimiter, async (req, res) => {
  try {
    const userId = req.user._id;
    const since  = new Date();
    since.setDate(since.getDate() - 30);

    const [progressEntries, profile] = await Promise.all([
      Progress.find({ user: userId, date: { $gte: since } }).sort({ date: -1 }).limit(20),
      AiUserProfile.findOne({ userId })
    ]);

    const workoutCount   = progressEntries.filter(p => p.type === 'workout_completion').length;
    const measurements   = progressEntries
      .filter(p => p.type === 'body_measurement' && p.measurements?.weight)
      .map(p => ({ date: p.date, weight: p.measurements.weight }));
    const weightTrend    = measurements.length >= 2
      ? (measurements[0].weight - measurements[measurements.length - 1].weight).toFixed(1)
      : null;

    const aiProfileSummary = profile
      ? `AI profile: ${profile.trainingConsistency.currentStreak}-day streak, ${profile.trainingConsistency.weeklyRate}% weekly rate, coachingLevel=${profile.coachingLevel}.`
      : '';

    const summary = `Progress (last 30 days) for ${req.user.name}:
- Level: ${req.user.experienceLevel || 'beginner'}
- Goals: ${req.user.fitnessGoals?.join(', ') || 'not set'}
- Workouts logged: ${workoutCount}
- Weight entries: ${measurements.length}
- Weight change: ${weightTrend !== null ? weightTrend + ' kg' : 'insufficient data'}
- Notes: ${progressEntries.slice(0, 3).map(p => p.notes).filter(Boolean).join('; ') || 'none'}
${aiProfileSummary}`;

    let analysis;
    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: buildEnrichedSystemPrompt(req.user, profile) },
          { role: 'user',   content: `Analyze this client's progress and give a motivating, honest 150-word assessment:\n\n${summary}\n\nInclude: 1) What's going well, 2) What to improve, 3) Three specific actions.` }
        ],
        max_tokens: 350,
        temperature: 0.7,
      });
      analysis = response.choices[0].message.content.trim();
    } catch {
      const fb = fallback.analyzeProgress({ totalWorkouts: workoutCount, weightChange: weightTrend });
      analysis = [fb.analysis, ...fb.suggestions.map((s, i) => `${i + 1}) ${s}`)].join('\n');
    }
    const lines      = analysis.split('\n').filter(l => l.trim());
    const suggestions = lines
      .filter(l => /^\d+[\).)]/.test(l.trim()) || l.trim().startsWith('-') || l.trim().startsWith('•'))
      .slice(0, 3)
      .map(l => l.replace(/^[\d\).\-•\s]+/, '').trim())
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        analysis,
        suggestions: suggestions.length ? suggestions : [
          'Stay consistent with your workouts',
          'Track your progress weekly',
          'Focus on recovery and sleep'
        ],
        stats: { workoutCount, weightChange: weightTrend }
      }
    });
  } catch (error) {
    aiError(res, error);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// VIDEO / FORM ANALYSIS (stub — form tips only)
// ════════════════════════════════════════════════════════════════════════════

router.post('/analyze-video', protect, async (req, res) => {
  try {
    const { exerciseName } = req.body;
    if (!exerciseName || typeof exerciseName !== 'string') {
      return res.status(400).json({ success: false, message: 'exerciseName is required' });
    }

    const profile = await AiUserProfile.findOne({ userId: req.user._id });

    let feedback;
    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: buildEnrichedSystemPrompt(req.user, profile) },
          { role: 'user',   content: `Give 5 key form tips for ${exerciseName.trim()}. Each tip in one concise sentence.` }
        ],
        max_tokens: 300,
        temperature: 0.6,
      });
      feedback = response.choices[0].message.content.trim();
    } catch {
      feedback = [
        `1. Warm up with 1-2 light sets of ${exerciseName.trim()} before working weight.`,
        '2. Keep a neutral spine and brace your core before every rep.',
        '3. Control the lowering phase (2-3 seconds) — do not drop the weight.',
        '4. Use a full, pain-free range of motion; stop if a joint hurts.',
        '5. Film yourself from the side and compare with your coach\'s demo.',
      ].join('\n');
    }

    res.json({
      success: true,
      data: {
        feedback,
        note: 'Live video analysis coming in a future update'
      }
    });
  } catch (error) {
    aiError(res, error);
  }
});

module.exports = router;
