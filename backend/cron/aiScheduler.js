/**
 * aiScheduler.js
 *
 * Cron jobs that keep the AI coaching platform running autonomously:
 *
 *   • Daily 09:00  — refresh inactivity flags + send recommendations to inactive users
 *   • Daily 18:00  — clear daily-tip cache so tomorrow generates a fresh tip
 *   • Weekly Sun 08:00 — personalised weekly check-in for every user with a profile
 */

const cron          = require('node-cron');
const AiUserProfile = require('../models/AiUserProfile');
const WorkoutPlan   = require('../models/WorkoutPlan');
const User          = require('../models/User');
const Notification  = require('../models/Notification');
const { runInactivityCheck }      = require('../services/aiBehaviorTracker');
const { runRecommendationCycle }  = require('../services/aiRecommendationEngine');
const { generateCoachInsight }    = require('../services/aiCoachService');

// ── Scheduler entry point ─────────────────────────────────────────────────────

function startScheduler() {
  console.log('[AI Scheduler] Starting...');

  // ── Daily 09:00 — inactivity check + recommendations ──────────────────────
  cron.schedule('0 9 * * *', async () => {
    console.log('[AI Scheduler] Daily inactivity check starting...');
    try {
      const inactivity = await runInactivityCheck();
      console.log(`[AI Scheduler] Inactivity check: ${inactivity.checked} profiles updated`);

      const recs = await runRecommendationCycle();
      console.log(`[AI Scheduler] Recommendations sent: ${recs.sent}`);
    } catch (err) {
      console.error('[AI Scheduler] Daily check failed:', err.message);
    }
  });

  // ── Daily 18:00 — clear stale daily-tip cache ──────────────────────────────
  cron.schedule('0 18 * * *', async () => {
    console.log('[AI Scheduler] Clearing daily tip cache...');
    try {
      const result = await AiUserProfile.updateMany(
        {},
        { $set: { lastDailyTipDate: null, lastDailyTip: null } }
      );
      console.log(`[AI Scheduler] Tip cache cleared for ${result.modifiedCount} profiles`);
    } catch (err) {
      console.error('[AI Scheduler] Tip cache clear failed:', err.message);
    }
  });

  // ── Weekly Sunday 08:00 — personalised coaching check-in ─────────────────
  cron.schedule('0 8 * * 0', async () => {
    console.log('[AI Scheduler] Weekly coaching check-in starting...');
    try {
      const result = await weeklyCoachingCheckIn();
      console.log(`[AI Scheduler] Weekly check-in: ${result.notified} notifications sent`);
    } catch (err) {
      console.error('[AI Scheduler] Weekly check-in failed:', err.message);
    }
  });

  console.log('[AI Scheduler] All jobs registered.');
}

// ── Weekly coaching check-in ──────────────────────────────────────────────────

/**
 * For every user with an AiUserProfile:
 *   1. Generate a personalised coaching insight (AI call).
 *   2. Find their active workout plan (if any).
 *   3. Send a tailored in-app notification.
 *
 * Skips users if the AI call fails — one bad user should not block others.
 */
async function weeklyCoachingCheckIn() {
  const profiles = await AiUserProfile.find({}).select('userId behavior trainingConsistency coachingLevel');

  let notified = 0;

  for (const profile of profiles) {
    try {
      const user = await User.findById(profile.userId).select('name experienceLevel fitnessGoals weight height');
      if (!user) continue;

      // Get insight (uses OpenAI) — falls back to static message if AI unavailable
      let message;
      try {
        const insight = await generateCoachInsight(user, profile);
        message = insight.motivation;
      } catch {
        // Graceful fallback — no AI key or rate-limited
        const b = profile.behavior;
        if (b.isInactive) {
          message = `Hey ${user.name}, your workout plan is waiting for you! Let's get back on track 💪`;
        } else if (b.isConsistent) {
          message = `Great week, ${user.name}! Keep the momentum going — you're building something special 🔥`;
        } else {
          message = `Weekly check-in: stay consistent, ${user.name}. Small steps lead to big results ✅`;
        }
      }

      // Find active plan for context
      const plan = await WorkoutPlan.findOne({
        assignedTo: profile.userId,
        status: 'active'
      }).select('title _id');

      const title = plan
        ? `Weekly Coach Check-In — ${plan.title}`
        : 'Weekly AI Coach Check-In';

      await Notification.create({
        recipient: profile.userId,
        type: 'ai_coach',
        title,
        message: message.slice(0, 500),
        category: 'ai',
        priority: 'normal',
        data: {
          customData: {
            source: 'weekly_scheduler',
            planId: plan?._id?.toString() ?? null
          }
        }
      });

      notified++;
    } catch (err) {
      console.error(`[AI Scheduler] Check-in failed for user ${profile.userId}:`, err.message);
    }
  }

  return { notified };
}

module.exports = { startScheduler };
