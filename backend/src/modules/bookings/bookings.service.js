'use strict';

const Booking = require('../../models/Booking');
const CoachAvailability = require('../../models/CoachAvailability');
const User = require('../../../models/User');
const { AppError } = require('../../middlewares/error.middleware');

function generateSlots(schedule, date, sessionMin, bufferMin) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = schedule.weeklySchedule[dayName];
  if (!daySchedule?.enabled || !daySchedule.slots?.length) return [];

  const slots = [];
  for (const slot of daySchedule.slots) {
    let [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    const endTotal = eh * 60 + em;

    while (sh * 60 + sm + sessionMin <= endTotal) {
      const startStr = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
      const endMin = sh * 60 + sm + sessionMin;
      const endStr = `${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;
      slots.push({ startTime: startStr, endTime: endStr });
      sm += sessionMin + bufferMin;
      if (sm >= 60) { sh += Math.floor(sm/60); sm %= 60; }
    }
  }
  return slots;
}

async function getAvailableSlots(coachId, from, to) {
  const coach = await User.findById(coachId);
  if (!coach || coach.role !== 'coach') throw new AppError('Coach not found', 404);

  const schedule = await CoachAvailability.findOne({ coach: coachId });
  if (!schedule) return [];

  const blockedDates = (schedule.blockedDates || []).map((d) => d.toDateString());

  const results = [];
  const cursor = new Date(from);
  cursor.setHours(0,0,0,0);
  const end = new Date(to);
  end.setHours(23,59,59,999);
  // Never look further ahead than the coach allows (default 30 days, hard cap 90).
  const maxDays = Math.min(schedule.maxAdvanceDays || 30, 90);
  const limit = new Date(Date.now() + maxDays * 86400000);
  if (end > limit) end.setTime(limit.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (cursor < today) cursor.setTime(today.getTime());

  while (cursor <= end) {
    const dateStr = cursor.toDateString();
    if (!blockedDates.includes(dateStr)) {
      const allSlots = generateSlots(schedule, cursor, schedule.sessionDurationMin, schedule.bufferMin);

      const booked = await Booking.find({
        coach: coachId,
        'slot.date': { $gte: new Date(cursor), $lt: new Date(cursor.getTime() + 86400000) },
        status: { $in: ['pending', 'confirmed'] },
      }).select('slot.startTime slot.endTime');

      const bookedTimes = new Set(booked.map((b) => b.slot.startTime));
      const now = Date.now();
      const available = allSlots.filter((s) => {
        if (bookedTimes.has(s.startTime)) return false;
        const [h, m] = s.startTime.split(':').map(Number);
        const startsAt = new Date(cursor);
        startsAt.setHours(h, m, 0, 0);
        return startsAt.getTime() > now; // hide times that already passed today
      });

      if (available.length) {
        results.push({ date: new Date(cursor), slots: available });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

async function createBooking(clientId, data) {
  const { coachId, date, startTime, endTime, type, notes } = data;

  const coach = await User.findById(coachId);
  if (!coach || coach.role !== 'coach') throw new AppError('Coach not found', 404);

  const availability = await CoachAvailability.findOne({ coach: coachId });
  if (!availability) throw new AppError('This coach has not published a schedule yet', 400);

  // The requested slot must be one the coach actually offers on that day.
  const day = new Date(date);
  const [sh, sm] = String(startTime).split(':').map(Number);
  const startsAt = new Date(day);
  startsAt.setHours(sh, sm, 0, 0);
  if (startsAt.getTime() <= Date.now()) throw new AppError('This time has already passed', 400);
  const offered = generateSlots(availability, day, availability.sessionDurationMin, availability.bufferMin);
  const blocked = (availability.blockedDates || []).some((d) => d.toDateString() === day.toDateString());
  if (blocked || !offered.some((s) => s.startTime === startTime && s.endTime === endTime)) {
    throw new AppError('The coach is not available at this time', 400);
  }

  const conflict = await Booking.hasConflict(coachId, date, startTime, endTime);
  if (conflict) throw new AppError('This time slot is already booked', 409);

  const price = availability.sessionPrice || 0;

  const booking = await Booking.create({
    client: clientId,
    coach: coachId,
    slot: { date, startTime, endTime, durationMin: availability?.sessionDurationMin || 60 },
    type,
    notes,
    price,
    status: 'pending',
  });

  return booking.populate([
    { path: 'coach', select: 'name avatar specialization' },
    { path: 'client', select: 'name avatar' },
  ]);
}

async function getClientBookings(clientId, { status, page = 1, limit = 10 }) {
  const filter = { client: clientId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate('coach', 'name avatar specialization')
      .sort({ 'slot.date': -1 })
      .skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  return { items, total };
}

async function getCoachBookings(coachId, { status, page = 1, limit = 10 }) {
  const filter = { coach: coachId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate('client', 'name avatar')
      .sort({ 'slot.date': -1 })
      .skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  return { items, total };
}

async function updateBookingStatus(bookingId, actorId, actorRole, { status, cancelReason, coachNotes }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  // actorId arrives as an ObjectId from req.user — compare as strings.
  const actor = actorId.toString();
  const isCoach = actorRole === 'coach' && booking.coach.toString() === actor;
  const isClient = actorRole === 'client' && booking.client.toString() === actor;
  const isAdmin = actorRole === 'admin';

  if (!isCoach && !isClient && !isAdmin) throw new AppError('Not authorized', 403);
  if (status === 'confirmed' && !isCoach && !isAdmin) throw new AppError('Only coach can confirm', 403);
  if (status === 'completed' && !isCoach && !isAdmin) throw new AppError('Only coach can complete', 403);

  booking.status = status;
  if (status === 'cancelled') {
    booking.cancelReason = cancelReason;
    booking.cancelledBy = actorId;
    booking.cancelledAt = new Date();
  }
  if (status === 'confirmed') booking.confirmedAt = new Date();
  if (status === 'completed') booking.completedAt = new Date();
  if (coachNotes) booking.coachNotes = coachNotes;

  await booking.save();
  return booking;
}

async function addRating(bookingId, clientId, { score, review }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.client.toString() !== clientId.toString()) throw new AppError('Not your booking', 403);
  if (booking.status !== 'completed') throw new AppError('Can only rate completed sessions', 400);
  if (booking.rating?.score) throw new AppError('Already rated', 409);

  booking.rating = { score, review, reviewedAt: new Date() };
  await booking.save();
  return booking;
}

// ── Coach availability (weekly schedule) ─────────────────────────────────────
async function getAvailability(coachId) {
  const schedule = await CoachAvailability.findOne({ coach: coachId });
  return schedule; // null when the coach has not set one up yet
}

async function setAvailability(coachId, data) {
  const update = { ...data, coach: coachId };
  return CoachAvailability.findOneAndUpdate({ coach: coachId }, update, {
    new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true,
  });
}

module.exports = {
  getAvailableSlots, createBooking, getClientBookings, getCoachBookings,
  updateBookingStatus, addRating, getAvailability, setAvailability, generateSlots,
};
