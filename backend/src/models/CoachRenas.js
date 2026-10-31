'use strict';
const mongoose = require('mongoose');

const { Schema } = mongoose;

// ── Subscription / purchase ──────────────────────────────────────────────────
// One row per purchase: an app tier (Training / Training+Food / All-Access),
// a one-time program, or 1-on-1 coaching. Starts "pending"; becomes "active"
// when the coach confirms the payment (or, later, when a store receipt is verified).
const subscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['tier', 'program', 'coaching', 'trial'], required: true },
    key: { type: String, required: true },            // training | food | all | fatloss | coaching ...
    period: { type: String, required: true },         // m1 | m3 | m6 | m12 | once | trial
    amount: { type: Number, required: true, min: 0 }, // IQD
    currency: { type: String, default: 'IQD' },
    channel: { type: String, enum: ['store', 'direct', 'free'], required: true },
    method: {
      type: String,
      enum: ['google_play', 'apple', 'zaincash', 'fib', 'qi', 'transfer', 'cash', 'free'],
      required: true,
    },
    status: { type: String, enum: ['pending', 'active', 'rejected', 'expired', 'cancelled'], default: 'pending', index: true },
    receiptUrl: { type: String, maxlength: 500 },
    storeToken: { type: String, maxlength: 2000 },  // Play purchase token / Apple receipt (placeholder, never verified yet)
    reference: { type: String, index: true },
    note: { type: String, maxlength: 500 },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date,
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true },
);

// ── Coaching client profile (answers from onboarding) ────────────────────────
const clientSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    goal: { type: String, enum: ['strength', 'muscle', 'fat', 'fit', 'sport'], default: 'fit' },
    level: { type: String, enum: ['beg', 'mid', 'adv'], default: 'beg' },
    days: { type: Number, min: 2, max: 6, default: 3 },
    place: { type: String, enum: ['gym', 'db', 'bands', 'none'], default: 'gym' },
    injuries: [{ type: String, maxlength: 40 }],
    parqFlag: { type: Boolean, default: false },   // answered "yes" to a health-screen question
    sex: { type: String, enum: ['m', 'f'], default: 'm' },
    age: { type: Number, min: 10, max: 100 },
    kg: { type: Number, min: 25, max: 300 },
    cm: { type: Number, min: 100, max: 250 },
    programKey: { type: String, maxlength: 40 },   // assigned program (see mobile assets programs)
    coachNote: { type: String, maxlength: 2000 },  // private note from the coach
  },
  { timestamps: true },
);

// ── Weekly check-in ──────────────────────────────────────────────────────────
const checkInSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kg: { type: Number, min: 25, max: 300 },
    sleep: { type: Number, min: 1, max: 5 },
    energy: { type: Number, min: 1, max: 5 },
    workoutsDone: { type: Number, min: 0, max: 14 },
    note: { type: String, maxlength: 1000 },
    photoUrl: { type: String, maxlength: 500 },
    reply: { type: String, maxlength: 2000 },
    repliedAt: Date,
  },
  { timestamps: true },
);

// ── Content plan (Instagram) ─────────────────────────────────────────────────
const contentSchema = new Schema(
  {
    pillar: { type: String, enum: ['bjj', 'building', 'discipline', 'life', 'engage'], required: true },
    day: { type: String, maxlength: 20 },        // e.g. "السبت"
    date: Date,
    format: { type: String, enum: ['reel', 'photo', 'carousel', 'story'], default: 'reel' },
    idea: { type: String, required: true, maxlength: 300 },
    caption: { type: String, maxlength: 2200 },
    status: { type: String, enum: ['idea', 'filmed', 'posted'], default: 'idea' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = {
  CoachRenasSubscription: mongoose.model('CoachRenasSubscription', subscriptionSchema),
  CoachRenasClient: mongoose.model('CoachRenasClient', clientSchema),
  CoachRenasCheckIn: mongoose.model('CoachRenasCheckIn', checkInSchema),
  CoachRenasContent: mongoose.model('CoachRenasContent', contentSchema),
};
