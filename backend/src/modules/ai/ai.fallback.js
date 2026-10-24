'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Built-in coach "brain" used when no OpenAI key is configured (or OpenAI is
// down). Every AI feature keeps working with sensible, rule-based answers —
// the app never shows a dead "AI unavailable" screen to a gym member.
// ─────────────────────────────────────────────────────────────────────────────

const LIBRARY = {
  push:  [['Barbell Bench Press', 'chest'], ['Overhead Press', 'shoulders'], ['Incline Dumbbell Press', 'chest'], ['Lateral Raise', 'shoulders'], ['Triceps Pushdown', 'triceps']],
  pull:  [['Deadlift', 'back'], ['Pull-up / Lat Pulldown', 'back'], ['Barbell Row', 'back'], ['Face Pull', 'rear delts'], ['Biceps Curl', 'biceps']],
  legs:  [['Back Squat', 'quads'], ['Romanian Deadlift', 'hamstrings'], ['Walking Lunge', 'glutes'], ['Leg Press', 'quads'], ['Standing Calf Raise', 'calves']],
  full:  [['Goblet Squat', 'legs'], ['Push-up', 'chest'], ['Dumbbell Row', 'back'], ['Hip Thrust', 'glutes'], ['Plank', 'core']],
  cardio:[['Interval Bike (30s hard / 60s easy)', 'cardio'], ['Rowing Machine', 'cardio'], ['Jump Rope', 'cardio'], ['Incline Walk', 'cardio'], ['Burpees', 'full body']],
  core:  [['Plank', 'core'], ['Dead Bug', 'core'], ['Hanging Knee Raise', 'abs'], ['Russian Twist', 'obliques'], ['Bird Dog', 'lower back']],
};

const BODYWEIGHT_SWAP = {
  'Barbell Bench Press': 'Push-up', 'Overhead Press': 'Pike Push-up', 'Incline Dumbbell Press': 'Decline Push-up',
  'Lateral Raise': 'Wall Handstand Hold', 'Triceps Pushdown': 'Bench Dips', Deadlift: 'Single-leg Hip Hinge',
  'Pull-up / Lat Pulldown': 'Inverted Row (table)', 'Barbell Row': 'Towel Row', 'Face Pull': 'Prone Y-T-W Raise',
  'Biceps Curl': 'Backpack Curl', 'Back Squat': 'Bodyweight Squat', 'Romanian Deadlift': 'Glute Bridge',
  'Leg Press': 'Bulgarian Split Squat', 'Goblet Squat': 'Jump Squat', 'Dumbbell Row': 'Inverted Row (table)',
  'Rowing Machine': 'Mountain Climbers', 'Interval Bike (30s hard / 60s easy)': 'High Knees Intervals',
  'Incline Walk': 'Stair Climbing',
};

const SCHEME = {
  muscle_gain:  { sets: 4, reps: '8-12', rest: 90 },
  strength:     { sets: 5, reps: '3-5', rest: 180 },
  weight_loss:  { sets: 3, reps: '12-15', rest: 45 },
  endurance:    { sets: 3, reps: '15-20', rest: 30 },
  general_fitness: { sets: 3, reps: '10-12', rest: 60 },
};

function splitFor(days, goal) {
  if (days <= 2) return ['full', 'full'];
  if (days === 3) return goal === 'weight_loss' ? ['full', 'cardio', 'full'] : ['push', 'pull', 'legs'];
  if (days === 4) return ['push', 'pull', 'legs', goal === 'weight_loss' ? 'cardio' : 'core'];
  if (days === 5) return ['push', 'pull', 'legs', 'cardio', 'full'];
  return ['push', 'pull', 'legs', 'push', 'pull', 'legs'].slice(0, days);
}

const DAY_NAMES = { push: 'Push (chest, shoulders, triceps)', pull: 'Pull (back, biceps)', legs: 'Legs & glutes', full: 'Full body', cardio: 'Conditioning & cardio', core: 'Core & mobility' };

function normalizeGoal(goal = '') {
  const g = String(goal).toLowerCase();
  if (g.includes('loss') || g.includes('fat') || g.includes('lose')) return 'weight_loss';
  if (g.includes('strength') || g.includes('strong')) return 'strength';
  if (g.includes('endur') || g.includes('cardio')) return 'endurance';
  if (g.includes('muscle') || g.includes('gain') || g.includes('bulk') || g.includes('hypert')) return 'muscle_gain';
  return 'general_fitness';
}

function generateWorkout({ goal, level = 'beginner', daysPerWeek = 3, equipment = 'any', restrictions = '' }) {
  const days = Math.min(Math.max(parseInt(daysPerWeek, 10) || 3, 1), 6);
  const g = normalizeGoal(goal);
  const scheme = { ...SCHEME[g] };
  const lvl = String(level).toLowerCase();
  if (lvl.startsWith('beg')) scheme.sets = Math.max(2, scheme.sets - 1);
  if (lvl.startsWith('adv')) scheme.sets += 1;
  const bodyweight = /none|body|home/i.test(String(equipment));
  const perDay = lvl.startsWith('beg') ? 4 : 5;

  const plan = splitFor(days, g).map((type, i) => ({
    day: i + 1,
    name: DAY_NAMES[type],
    exercises: LIBRARY[type].slice(0, perDay).map(([name, muscle]) => ({
      name: bodyweight ? (BODYWEIGHT_SWAP[name] || name) : name,
      muscle,
      sets: type === 'cardio' ? 1 : scheme.sets,
      reps: type === 'cardio' ? '10-15 min' : scheme.reps,
      restSeconds: type === 'cardio' ? 60 : scheme.rest,
      notes: type === 'core' ? 'Slow and controlled, brace your core.' : '',
    })),
  }));

  return {
    title: `${days}-day ${g.replace('_', ' ')} plan (${lvl})`,
    description: `Built by City Gym's coach engine for a ${lvl} training ${days}x/week.` +
      (restrictions ? ` Restrictions noted: ${restrictions} — skip anything that hurts and ask your coach for a swap.` : '') +
      ' Warm up 5-10 minutes before every session and add a little weight or reps each week.',
    days: plan,
    source: 'built-in',
  };
}

function nutrition({ weight = 75, height = 175, age = 25, gender = 'male', goal = 'general_fitness', activityLevel = 'moderate' }) {
  const w = Number(weight) || 75; const h = Number(height) || 175; const a = Number(age) || 25;
  const bmr = gender === 'female'
    ? 447.6 + 9.25 * w + 3.1 * h - 4.33 * a
    : 88.36 + 13.4 * w + 4.8 * h - 5.68 * a;
  const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }[activityLevel] || 1.55;
  const tdee = Math.round(bmr * mult);
  const g = normalizeGoal(goal);
  const calories = g === 'weight_loss' ? tdee - 500 : g === 'muscle_gain' ? tdee + 300 : tdee;
  const protein = Math.round(w * (g === 'weight_loss' ? 2.2 : g === 'muscle_gain' ? 2.0 : 1.6));
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));

  const plan = [
    `Daily target: about ${calories} kcal (maintenance ≈ ${tdee} kcal).`,
    `Macros: protein ${protein} g · carbs ${carbs} g · fats ${fats} g.`,
    '',
    'Example day:',
    '• Breakfast — 3 eggs, oats with banana, a glass of milk or laban.',
    '• Lunch — rice or bulgur, grilled chicken or fish, a big salad with olive oil.',
    '• Dinner — lean meat or lentils, vegetables, bread or potatoes to fit your carbs.',
    '• Snacks — Greek yogurt, nuts, dates or fruit, a protein shake after training.',
    '',
    'Tips:',
    '1. Hit your protein first — spread it over 3-5 meals.',
    '2. Drink 30-40 ml of water per kg of bodyweight each day.',
    `3. Weigh yourself weekly; adjust by ±150 kcal if you are not moving toward your goal.`,
  ].join('\n');

  return { plan, tdee, bmr: Math.round(bmr), calories, macros: { protein, carbs, fats }, source: 'built-in' };
}

function analyzeProgress(progressData = {}) {
  const s = progressData.stats || progressData;
  const suggestions = [];
  const workouts = Number(s.totalWorkouts || 0);
  if (workouts < 8) suggestions.push('Aim for at least 3 workouts per week — consistency matters more than intensity.');
  else suggestions.push('Great consistency! Add a little weight or one more rep each week (progressive overload).');
  if (Number(s.averageEnergy || 0) && Number(s.averageEnergy) < 3) suggestions.push('Your energy is low — check sleep (7-9 h) and eat enough carbs around training.');
  if (s.weightChange && Number(s.weightChange) > 0 && /loss/.test(progressData.goal || '')) suggestions.push('Weight is going up while your goal is fat loss — trim ~200 kcal per day.');
  suggestions.push('Log every session so your coach can adjust your plan.');
  suggestions.push('Take progress photos every 2 weeks in the same light and pose.');
  return {
    analysis: workouts
      ? `You logged ${workouts} workout${workouts === 1 ? '' : 's'} in this period. Keep the momentum going and focus on steady progress.`
      : 'No workouts logged yet — start with 3 short sessions this week and log them in the app.',
    suggestions: suggestions.slice(0, 5),
    source: 'built-in',
  };
}

const CHAT_RULES = [
  [/protein|eat|diet|food|meal|calorie/i, 'Nutrition basics: eat 1.6-2.2 g of protein per kg of bodyweight, fill half your plate with vegetables, and match calories to your goal (−500 kcal to lose fat, +300 to build muscle). Try the Nutrition tool for exact numbers.'],
  [/lose|fat|weight loss|slim/i, 'For fat loss: a moderate calorie deficit, 3-4 strength sessions a week to keep muscle, 8-10k steps a day, and good sleep. Expect about 0.5 kg per week — slow is sustainable.'],
  [/muscle|bulk|gain|bigger|mass/i, 'To build muscle: train each muscle twice a week, 10-20 hard sets per muscle per week, add weight or reps over time, and eat a small calorie surplus with plenty of protein.'],
  [/pain|injur|hurt|sore/i, 'Normal soreness fades in 2-3 days. Sharp or joint pain is a stop sign — rest that movement and talk to your coach or a physiotherapist. Use the Anatomy explorer to read recovery tips for that area.'],
  [/sleep|rest|recover/i, 'Recovery: 7-9 hours of sleep, at least one full rest day per week, and lighter "deload" weeks every 6-8 weeks.'],
  [/cardio|run|endurance/i, 'Mix 2-3 easy cardio sessions (you can still talk) with 1 interval session per week. Keep strength training too — it protects your joints.'],
  [/motivat|lazy|tired|give up/i, 'Make it small and regular: book your sessions like meetings, train with a friend or coach, and track wins in the Progress tab. Showing up for 20 minutes still counts!'],
];

function chatReply(message = '') {
  for (const [re, answer] of CHAT_RULES) if (re.test(message)) return answer;
  return 'I am your City Gym coach assistant. Ask me about training, nutrition, fat loss, muscle gain, recovery or injuries — or use the Workout and Nutrition tools for a full plan. Your human coach can also answer in Chat.';
}

module.exports = { generateWorkout, nutrition, analyzeProgress, chatReply, normalizeGoal };
