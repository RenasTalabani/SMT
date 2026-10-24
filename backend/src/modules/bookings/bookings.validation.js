'use strict';

const Joi = require('joi');
const { objectId } = require('../../middlewares/validate.middleware');

const createBooking = Joi.object({
  coachId:   objectId.required(),
  // The day of the session (slot lists return local midnight). Whether the
  // exact start time is still in the future is checked in the service.
  date:      Joi.date().required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  endTime:   Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  type:      Joi.string().valid('personal_training','nutrition_consult','assessment','group_class','online').default('personal_training'),
  notes:     Joi.string().max(500).optional().allow(''),
});

const updateStatus = Joi.object({
  status:       Joi.string().valid('confirmed','cancelled','completed','no_show').required(),
  cancelReason: Joi.string().max(300).when('status', { is: 'cancelled', then: Joi.required() }),
  coachNotes:   Joi.string().max(500).optional().allow(''),
});

const addRating = Joi.object({
  score:  Joi.number().min(1).max(5).required(),
  review: Joi.string().max(500).optional().allow(''),
});

const availabilityQuery = Joi.object({
  coachId: objectId.required(),
  from:    Joi.date().min('now').required(),
  to:      Joi.date().min(Joi.ref('from')).required(),
});

const hhmm = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/);
const daySchedule = Joi.object({
  enabled: Joi.boolean().default(false),
  slots: Joi.array().items(Joi.object({ startTime: hhmm.required(), endTime: hhmm.required() })).default([]),
});
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const saveAvailability = Joi.object({
  weeklySchedule: Joi.object(Object.fromEntries(days.map((d) => [d, daySchedule]))).required(),
  sessionDurationMin: Joi.number().integer().min(15).max(240).default(60),
  bufferMin: Joi.number().integer().min(0).max(120).default(15),
  maxAdvanceDays: Joi.number().integer().min(1).max(365).default(30),
  sessionPrice: Joi.number().min(0).default(0),
  currency: Joi.string().max(5).default('usd'),
  blockedDates: Joi.array().items(Joi.date()).default([]),
  timezone: Joi.string().max(60).default('UTC'),
});

module.exports = { createBooking, updateStatus, addRating, availabilityQuery, saveAvailability };
