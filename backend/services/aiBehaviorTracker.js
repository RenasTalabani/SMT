/**
 * aiBehaviorTracker.js
 *
 * Tracks user training behavior and updates the AiUserProfile.
 * Called from workout routes (completion) and by the cron scheduler (inactivity checks).
 */

const AiUserProfile = require('../models/AiUserProfile');

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Get or create the AiUserProfile for a given userId.
 */
async function getOrCreateProfile(userId) {
  let profile = await AiUserProfile.findOne({ userId });
  if (!profile) {
    profile = new AiUserProfile({ userId });
    await profile.save();
  }
  return profile;
}

// ── Event tracking ────────────────────────────────────────────────────────────

/**
 * Track a confirmed workout completion.
 * Updates streak, totalCompleted, lastWorkoutDate, and behavior flags.
 */
async function trackWorkoutCompleted(userId) {
  const profile = await getOrCreateProfile(userId);
  profile.recordCompletion();
  profile.lastAnalyzedAt = new Date();
  await profile.save();
  return profile;
}

/**
 * Track a skipped / missed workout.
 * Resets streak, increments totalSkipped, updates behavior flags.
 */
async function trackWorkoutSkipped(userId) {
  const profile = await getOrCreateProfile(userId);
  profile.recordSkip();
  profile.lastAnalyzedAt = new Date();
  await profile.save();
  return profile;
}

// ── Context updates ───────────────────────────────────────────────────────────

/**
 * Update the user-specific context the AI uses (goals, injuries, preferences).
 * Only defined keys are updated — pass only what you want to change.
 */
async function updateUserContext(userId, { goals, injuries, preferredExercises, weakPoints } = {}) {
  const profile = await getOrCreateProfile(userId);
  if (Array.isArray(goals))              profile.goals              = goals;
  if (Array.isArray(injuries))           profile.injuries           = injuries;
  if (Array.isArray(preferredExercises)) profile.preferredExercises = preferredExercises;
  if (Array.isArray(weakPoints))         profile.weakPoints         = weakPoints;
  await profile.save();
  return profile;
}

// ── Inactivity checks ─────────────────────────────────────────────────────────

/**
 * Refresh inactivity flags for a single user.
 * Call this when the user opens the app or when a cron checks one user.
 */
async function refreshInactivityStatus(userId) {
  const profile = await AiUserProfile.findOne({ userId });
  if (!profile) return null;

  if (profile.trainingConsistency.lastWorkoutDate) {
    const daysSince = Math.floor(
      (new Date() - profile.trainingConsistency.lastWorkoutDate) / (1000 * 60 * 60 * 24)
    );
    profile.behavior.inactiveDays    = daysSince;
    profile.behavior.isInactive      = daysSince >= 3;
    profile.behavior.needsMotivation = daysSince >= 2;

    if (daysSince >= 3) profile.coachingLevel = 'gentle';

    await profile.save();
  }

  return profile;
}

/**
 * Bulk inactivity check — called every day by the cron scheduler.
 * Updates flags for all profiles that have a lastWorkoutDate recorded.
 */
async function runInactivityCheck() {
  const profiles = await AiUserProfile.find({
    'trainingConsistency.lastWorkoutDate': { $exists: true, $ne: null }
  });

  const now = new Date();
  let updated = 0;

  for (const profile of profiles) {
    const daysSince = Math.floor(
      (now - profile.trainingConsistency.lastWorkoutDate) / (1000 * 60 * 60 * 24)
    );

    profile.behavior.inactiveDays    = daysSince;
    profile.behavior.isInactive      = daysSince >= 3;
    profile.behavior.needsMotivation = daysSince >= 2;
    if (daysSince >= 3) profile.coachingLevel = 'gentle';

    await profile.save();
    updated++;
  }

  return { checked: profiles.length, updated };
}

module.exports = {
  getOrCreateProfile,
  trackWorkoutCompleted,
  trackWorkoutSkipped,
  updateUserContext,
  refreshInactivityStatus,
  runInactivityCheck
};
