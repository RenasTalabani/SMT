'use strict';

const service = require('./bookings.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAvailableSlots = async (req, res, next) => {
  try {
    const { coachId, from, to } = req.query;
    const slots = await service.getAvailableSlots(coachId, new Date(from), new Date(to));
    ApiResponse.success(res, { slots });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const booking = await service.createBooking(req.user._id, req.body);
    ApiResponse.created(res, { booking }, 'Booking created');
  } catch (err) { next(err); }
};

const myBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { items, total } = await service.getClientBookings(req.user._id, { status, page, limit });
    ApiResponse.paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
};

const coachBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { items, total } = await service.getCoachBookings(req.user._id, { status, page, limit });
    ApiResponse.paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const booking = await service.updateBookingStatus(
      req.params.id, req.user._id, req.user.role, req.body
    );
    ApiResponse.success(res, { booking }, 'Booking updated');
  } catch (err) { next(err); }
};

const rate = async (req, res, next) => {
  try {
    const booking = await service.addRating(req.params.id, req.user._id, req.body);
    ApiResponse.success(res, { booking }, 'Rating submitted');
  } catch (err) { next(err); }
};

module.exports = { getAvailableSlots, create, myBookings, coachBookings, updateStatus, rate };
