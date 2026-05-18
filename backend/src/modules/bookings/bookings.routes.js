'use strict';

const { Router } = require('express');
const ctrl = require('./bookings.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const v = require('./bookings.validation');

const router = Router();

router.get ('/slots',         validate(v.availabilityQuery, 'query'), ctrl.getAvailableSlots);
router.post('/',              protect, authorize('client'),           validate(v.createBooking), ctrl.create);
router.get ('/my',            protect,                                ctrl.myBookings);
router.get ('/coach',         protect, authorize('coach','admin'),    ctrl.coachBookings);
router.put ('/:id/status',    protect,                                validate(v.updateStatus),  ctrl.updateStatus);
router.post('/:id/rate',      protect, authorize('client'),           validate(v.addRating),     ctrl.rate);

module.exports = router;
