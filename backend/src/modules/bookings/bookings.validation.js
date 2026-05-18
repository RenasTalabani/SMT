'use strict';

const Joi = require('joi');
const { objectId } = require('../../middlewares/validate.middleware');

const createBooking = Joi.object({
  coachId:   objectId.required(),
  date:      Joi.date().min('now').required(),
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

module.exports = { createBooking, updateStatus, addRating, availabilityQuery };
