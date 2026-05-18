'use strict';

const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "09:00"
  endTime:   { type: String, required: true }, // "17:00"
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  weeklySchedule: {
    monday:    { enabled: { type: Boolean, default: false }, slots: [timeSlotSchema] },
    tuesday:   { enabled: { type: Boolean, default: false }, slots: [timeSlotSchema] },
    wednesday: { enabled: { type: Boolean, default: false }, slots: [timeSlotSchema] },
    thursday:  { enabled: { type: Boolean, default: false }, slots: [timeSlotSchema] },
    friday:    { enabled: { type: Boolean, default: false }, slots: [timeSlotSchema] },
    saturday:  { enabled: { type: Boolean, default: false }, slots: [timeSlotSchema] },
    sunday:    { enabled: { type: Boolean, default: false }, slots: [timeSlotSchema] },
  },
  sessionDurationMin: { type: Number, default: 60, min: 15, max: 240 },
  bufferMin: { type: Number, default: 15 },
  maxAdvanceDays: { type: Number, default: 30 },
  sessionPrice: { type: Number, default: 0 },
  currency: { type: String, default: 'usd' },
  blockedDates: [{ type: Date }],
  timezone: { type: String, default: 'UTC' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CoachAvailability', availabilitySchema);
