/**
 * aiCoachService.js
 *
 * Central intelligence layer for all AI interactions.
 * Builds personalized prompts using User + AiUserProfile data,
 * generates structured coaching insights, daily tips, and chat responses.
 */

const OpenAI = require('openai');

let openai = null;
function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// ── Prompt builders ───────────────────────────────────────────────────────────

/**
 * Build a rich system prompt that combines User schema fields
 * with the long-term AiUserProfile behavioral data.
 */
function buildEnrichedSystemPrompt(user, profile) {
  const level  = user?.experienceLevel || 'beginner';
  const goals  = (user?.fitnessGoals?.length ? user.fitnessGoals : profile?.goals ?? []).join(', ') || 'general fitness';
  const weight = user?.weight  ? `${user.weight} kg`  : 'unknown';
  const height = user?.height  ? `${user.height} cm`  : 'unknown';

  // Behavioral context (only if profile exists)
  let behaviorBlock = '';
  if (profile) {
    const c = profile.trainingConsistency;
    const b = profile.behavior;
    const status = b.isInactive
      ? `INACTIVE — ${b.inactiveDays} day(s) without a workout`
      : b.isConsistent
        ? `CONSISTENT — ${c.currentStreak}-day streak, ${c.weeklyRate}% weekly rate`
        : `BUILDING HABITS — ${c.weeklyRate}% weekly rate`;

    behaviorBlock = `
Training behavior:
- Workouts completed: ${c.totalCompleted}
- Current streak: ${c.currentStreak} day(s)
- Longest streak: ${c.longestStreak} day(s)
- Weekly consistency: ${c.weeklyRate}%
- Status: ${status}
- Ready for progression: ${b.readyForProgression ? 'YES' : 'not yet'}`;
  }

  const injuriesBlock = profile?.injuries?.length
    ? `\nInjuries / limitations: ${profile.injuries.join(', ')}`
    : '';

  const prefBlock = profile?.preferredExercises?.length
    ? `\nPreferred exercises: ${profile.preferredExercises.join(', ')}`
    : '';

  const toneMap = {
    gentle:   'Be extra warm and encouraging. Acknowledge struggles. Focus on small wins. Never be demanding.',
    moderate: 'Balance motivation with realism. Coach-like, direct, and supportive.',
    intense:  'Push them. They are ready for challenge. Be ambitious and demanding.'
  };
  const tone = toneMap[profile?.coachingLevel ?? 'moderate'];

  return `You are Coach AI — an intelligent, personalized fitness coach inside the City GYM app.

Client profile:
- Name: ${user?.name || 'Client'}
- Experience level: ${level}
- Goals: ${goals}
- Weight: ${weight} | Height: ${height}${injuriesBlock}${prefBlock}
${behaviorBlock}

Coaching style: ${tone}

Rules:
- Keep answers concise and actionable (2-4 sentences unless more detail is requested)
- Adapt advice to the client's experience level AND behavior pattern above
- If the client is inactive, gently re-engage — acknowledge the gap, remove guilt, lower the bar
- If the client is consistent, celebrate and raise the challenge
- Never give medical advice; refer to a doctor when needed
- Only answer about fitness, nutrition, wellness, and training`;
}

// ── Core generation functions ─────────────────────────────────────────────────

/**
 * Generate a structured coaching insight object.
 * Returns: { motivation, action_plan[], tips[], coachingLevel, raw, generatedAt }
 */
async function generateCoachInsight(user, profile) {
  const b = profile?.behavior ?? {};
  const c = profile?.trainingConsistency ?? {};
  const level = user?.experienceLevel || 'beginner';
  const goals = user?.fitnessGoals?.join(', ') || 'general fitness';

  let userContext;
  if (b.isInactive && b.inactiveDays >= 3) {
    userContext = `${user.name} hasn't trained in ${b.inactiveDays} day(s). Write a short, empathetic re-engagement message. Format exactly:
MOTIVATION: <one sentence>
ACTION 1: <easy action to get back on track>
ACTION 2: <second easy action>
TIP: <one practical tip>`;
  } else if (b.readyForProgression) {
    userContext = `${user.name} has a ${c.currentStreak}-day streak and ${c.weeklyRate}% consistency — they are ready to level up. Write a progression-focused message. Format exactly:
MOTIVATION: <one celebration + challenge sentence>
ACTION 1: <progression suggestion>
ACTION 2: <second progression suggestion>
TIP: <one advanced tip>`;
  } else if (b.needsMotivation) {
    userContext = `${user.name} needs a habit boost (${c.weeklyRate}% consistency). Write a supportive coaching message. Format exactly:
MOTIVATION: <one encouraging sentence>
ACTION 1: <habit-building action>
ACTION 2: <second habit-building action>
TIP: <one mindset tip>`;
  } else {
    userContext = `Write a weekly coaching insight for ${user.name} (${level}, goals: ${goals}). Format exactly:
MOTIVATION: <one motivating sentence>
ACTION 1: <focus area for this week>
ACTION 2: <second focus area>
TIP: <one practical tip>`;
  }

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: buildEnrichedSystemPrompt(user, profile) },
      { role: 'user',   content: userContext }
    ],
    max_tokens: 300,
    temperature: 0.8,
  });

  const raw = response.choices[0].message.content.trim();

  // Parse structured format
  const extract = (key) => {
    const match = raw.match(new RegExp(`${key}:\\s*(.+)`, 'i'));
    return match ? match[1].trim() : null;
  };

  const motivation  = extract('MOTIVATION') || raw.split('\n')[0] || raw;
  const action1     = extract('ACTION 1');
  const action2     = extract('ACTION 2');
  const tip         = extract('TIP');

  return {
    motivation,
    action_plan: [action1, action2].filter(Boolean),
    tips: tip ? [tip] : [],
    coachingLevel: profile?.coachingLevel || 'moderate',
    raw,
    generatedAt: new Date()
  };
}

/**
 * Generate a single daily tip (cached per day by the recommendation engine).
 */
async function generateDailyTip(user, profile) {
  const level  = user?.experienceLevel || 'beginner';
  const goals  = user?.fitnessGoals?.join(', ') || 'general fitness';
  const b      = profile?.behavior;

  const context = b?.isInactive
    ? 'They need motivation to get moving again. Make the tip about returning to training easily.'
    : b?.isConsistent
      ? 'They are consistent and ready for challenges. Make the tip about progression or advanced technique.'
      : 'They are building their fitness habit. Make the tip practical and encouraging.';

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a professional fitness coach. Give one specific, actionable daily fitness tip in 1-2 sentences. Be direct and practical. No fluff.' },
      { role: 'user',   content: `Daily tip for a ${level} with goals: ${goals}. ${context}` }
    ],
    max_tokens: 100,
    temperature: 0.9,
  });

  return response.choices[0].message.content.trim();
}

/**
 * Enhanced chat response — uses full profile context for personalization.
 */
async function generateChatResponse(message, history, user, profile) {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: buildEnrichedSystemPrompt(user, profile) },
      ...history,
      { role: 'user', content: message }
    ],
    max_tokens: 400,
    temperature: 0.75,
  });

  return response.choices[0].message.content.trim();
}

module.exports = {
  buildEnrichedSystemPrompt,
  generateCoachInsight,
  generateDailyTip,
  generateChatResponse
};
