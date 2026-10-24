'use strict';
const mongoose = require('mongoose');

// A scheduled group class (e.g. "Morning HIIT", Monday 07:00, 20 spots).
const gymClassSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true, trim: true, maxlength: 100 },
    titleAr: { type: String, trim: true, maxlength: 100 },
    titleKu: { type: String, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 1000 },
    category: {
      type: String,
      enum: ['hiit', 'strength', 'cardio', 'yoga', 'boxing', 'cycling', 'crossfit', 'other'],
      default: 'other',
    },
    coach:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startsAt: { type: Date, required: true, index: true },
    durationMin: { type: Number, default: 60, min: 15, max: 240 },
    capacity: { type: Number, default: 20, min: 1, max: 500 },
    location: { type: String, maxlength: 100, default: 'Main hall' },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // booked
    attended:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // checked in
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

gymClassSchema.virtual('spotsLeft').get(function () {
  return Math.max(0, this.capacity - (this.attendees?.length || 0));
});

module.exports = mongoose.model('GymClass', gymClassSchema);
