/**
 * aiRecommendationEngine.js
 *
 * Trigger-based recommendation system.
 * Generates personalized suggestions and dispatches in-app notifications.
 *
 * Triggers:
 *   'inactive'       — user has not worked out in 3+ days
 *   'all_completed'  — user completed all workouts (weekly milestone)
 *   'app_open'       — user opened the app (on-demand insight)
 *   'weekly_check'   — scheduled weekly coaching check-in
 */

const Notification  = require('../models/Notification');
const User          = require('../models/User');
const AiUserProfile = require('../models/AiUserProfile');
const { generateCoachInsight, generateDailyTip } = require('./aiCoachService');

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Create an in-app notification for the user.
 * Uses type='ai_coach' and category='ai' (added to Notification schema).
 */
async function _createNotification(userId, title, message, priority = 'normal') {
  try {
    await Notification.create({
      recipient: userId,
      type: 'ai_coach',
      title,
      message: message.slice(0, 500), // schema maxlength
      category: 'ai',
      priority,
      data: { customData: { source: 'ai_recommendation_engine' } }
    });
  } catch (err) {
    // Non-critical — log and continue
    console.error('[RecommendationEngine] Notification create failed:', err.message);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Core recommendation generator.
 * Builds a structured coaching insight, stores it in the profile, and
 * fires a notification for high-priority triggers.
 *
 * Returns the insight object or null on failure.
 */
async function generateRecommendation(userId, trigger = 'app_open') {
  try {
    const [user, profile] = await Promise.all([
      User.findById(userId),
      AiUserProfile.findOne({ userId })
    ]);

    if (!user || !profile) return null;

    const insight = await generateCoachInsight(user, profile);

    // Determine recommendation type from trigger
    const recType = {
      inactive:      'motivation',
      all_completed: 'workout',
      weekly_check:  'tip',
      app_open:      'tip'
    }[trigger] ?? 'tip';

    profile.addRecommendation(recType, insight.motivation);
    await profile.save();

    // Push an in-app notification for high-value triggers
    if (trigger === 'inactive') {
      await _createNotification(
        userId,
        `${user.name}, your Coach misses you! 💪`,
        insight.motivation,
        'high'
      );
    } else if (trigger === 'all_completed') {
      await _createNotification(
        userId,
        `Amazing work, ${user.name}! 🎉`,
        insight.motivation,
        'normal'
      );
    }

    return insight;
  } catch (err) {
    console.error(`[RecommendationEngine] generateRecommendation failed (${userId}):`, err.message);
    return null;
  }
}

/**
 * Get today's daily tip for a user.
 * Returns cached tip if one was already generated today; generates fresh otherwise.
 */
async function getDailyTip(userId) {
  try {
    const [user, profile] = await Promise.all([
      User.findById(userId),
      AiUserProfile.findOne({ userId })
    ]);

    if (!user) return null;

    // Return cached tip if generated today
    if (profile?.lastDailyTipDate && profile?.lastDailyTip) {
      const sameDay = new Date().toDateString() === new Date(profile.lastDailyTipDate).toDateString();
      if (sameDay) return { tip: profile.lastDailyTip, cached: true };
    }

    // Generate a fresh tip
    const tip = await generateDailyTip(user, profile);

    // Cache it in the profile
    if (profile) {
      profile.lastDailyTip     = tip;
      profile.lastDailyTipDate = new Date();
      await profile.save();
    }

    return { tip, cached: false };
  } catch (err) {
    console.error(`[RecommendationEngine] getDailyTip failed (${userId}):`, err.message);
    return null;
  }
}

/**
 * Process a streak milestone or completion achievement.
 * Fires when currentStreak is a multiple of 7 (weekly milestone).
 */
async function processWorkoutMilestone(userId) {
  const profile = await AiUserProfile.findOne({ userId });
  if (!profile) return null;

  const streak = profile.trainingConsistency.currentStreak;
  if (streak > 0 && streak % 7 === 0) {
    return generateRecommendation(userId, 'all_completed');
  }
  return null;
}

/**
 * Bulk recommendation pass for inactive users — called by the cron scheduler.
 * Only sends to users that have been inactive exactly 3, 7, or 14 days to
 * avoid spamming with daily notifications.
 */
async function runRecommendationCycle() {
  const inactiveProfiles = await AiUserProfile.find({
    'behavior.isInactive': true,
    'behavior.inactiveDays': { $in: [3, 7, 14] }
  }).select('userId behavior.inactiveDays');

  let sent = 0;
  for (const p of inactiveProfiles) {
    await generateRecommendation(p.userId, 'inactive');
    sent++;
  }

  return { processed: inactiveProfiles.length, sent };
}

module.exports = {
  generateRecommendation,
  getDailyTip,
  processWorkoutMilestone,
  runRecommendationCycle
};
