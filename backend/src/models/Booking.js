'use strict';

const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime:   { type: String, required: true }, // "10:00"
  durationMin: { type: Number, default: 60 },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  slot: { type: slotSchema, required: true },
  type: {
    type: String,
    enum: ['personal_training', 'nutrition_consult', 'assessment', 'group_class', 'online'],
    default: 'personal_training',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending',
    index: true,
  },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'usd' },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  paymentIntentId: { type: String },
  notes: { type: String, maxlength: 500 },
  clientNotes: { type: String, maxlength: 500 },
  coachNotes: { type: String, maxlength: 500 },
  cancelReason: { type: String, maxlength: 300 },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  reminderSent: { type: Boolean, default: false },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 500 },
    reviewedAt: { type: Date },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

bookingSchema.index({ 'slot.date': 1, coach: 1 });
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ coach: 1, status: 1 });

bookingSchema.virtual('isPast').get(function () {
  return new Date(this.slot.date) < new Date();
});

bookingSchema.statics.hasConflict = async function (coachId, date, startTime, endTime, excludeId) {
  const query = {
    coach: coachId,
    'slot.date': date,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { 'slot.startTime': { $lt: endTime, $gte: startTime } },
      { 'slot.endTime': { $gt: startTime, $lte: endTime } },
    ],
  };
  if (excludeId) query._id = { $ne: excludeId };
  return (await this.countDocuments(query)) > 0;
};

module.exports = mongoose.model('Booking', bookingSchema);
