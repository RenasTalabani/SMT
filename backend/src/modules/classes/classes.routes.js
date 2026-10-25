'use strict';

// Group classes: coaches/admins schedule them, members join/leave,
// coaches take attendance (check-in).

const { Router } = require('express');
const Joi = require('joi');
const GymClass = require('../../models/GymClass');
const ApiResponse = require('../../utils/ApiResponse');
const { protect, authorize, requireApproval } = require('../../middlewares/auth.middleware');
const { validate, objectId } = require('../../middlewares/validate.middleware');
const { AppError } = require('../../middlewares/error.middleware');

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const classBody = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  titleAr: Joi.string().trim().max(100).allow(''),
  titleKu: Joi.string().trim().max(100).allow(''),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('hiit', 'strength', 'cardio', 'yoga', 'boxing', 'cycling', 'crossfit', 'other').default('other'),
  startsAt: Joi.date().greater('now').required(),
  durationMin: Joi.number().integer().min(15).max(240).default(60),
  capacity: Joi.number().integer().min(1).max(500).default(20),
  location: Joi.string().max(100).allow(''),
  coachId: objectId.optional(),                        // admins may assign a coach
  repeatWeeks: Joi.number().integer().min(1).max(12).default(1), // create N weekly sessions
});

const updateBody = classBody.fork(['title', 'startsAt'], (s) => s.optional()).keys({ repeatWeeks: Joi.forbidden() });

const attendanceBody = Joi.object({ userId: objectId.required(), present: Joi.boolean().required() });

function canManage(user, cls) {
  return user.role === 'admin' || cls.coach.toString() === user._id.toString();
}

router.use(protect);

// Upcoming classes (default next 14 days). ?mine=true → only classes I joined / teach.
router.get('/', wrap(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 14, 60);
  const from = new Date(Date.now() - 2 * 3600 * 1000);
  const to = new Date(Date.now() + days * 86400000);
  const filter = { startsAt: { $gte: from, $lte: to }, isCancelled: false };
  if (req.query.mine === 'true') {
    filter.$or = [{ attendees: req.user._id }, { coach: req.user._id }];
  }
  const classes = await GymClass.find(filter).populate('coach', 'name avatar').sort({ startsAt: 1 }).limit(300);
  ApiResponse.success(res, { classes });
}));

router.post('/', authorize('coach', 'admin'), requireApproval, validate(classBody), wrap(async (req, res) => {
  const { repeatWeeks, coachId, ...data } = req.body;
  const coach = req.user.role === 'admin' && coachId ? coachId : req.user._id;
  const docs = [];
  for (let w = 0; w < repeatWeeks; w += 1) {
    const startsAt = new Date(new Date(data.startsAt).getTime() + w * 7 * 86400000);
    docs.push({ ...data, startsAt, coach });
  }
  const classes = await GymClass.insertMany(docs);
  ApiResponse.created(res, { classes }, `${classes.length} class session(s) scheduled`);
}));

router.put('/:id', authorize('coach', 'admin'), validate(updateBody), wrap(async (req, res) => {
  const cls = await GymClass.findById(req.params.id);
  if (!cls) throw new AppError('Class not found', 404);
  if (!canManage(req.user, cls)) throw new AppError('Not your class', 403);
  const { coachId, ...data } = req.body;
  Object.assign(cls, data);
  if (coachId && req.user.role === 'admin') cls.coach = coachId;
  if (cls.capacity < cls.attendees.length) throw new AppError('Capacity is below the number of booked members', 400);
  await cls.save();
  ApiResponse.success(res, { class: cls });
}));

router.delete('/:id', authorize('coach', 'admin'), wrap(async (req, res) => {
  const cls = await GymClass.findById(req.params.id);
  if (!cls) throw new AppError('Class not found', 404);
  if (!canManage(req.user, cls)) throw new AppError('Not your class', 403);
  cls.isCancelled = true;
  await cls.save();
  ApiResponse.success(res, {}, 'Class cancelled');
}));

router.post('/:id/join', authorize('client'), wrap(async (req, res) => {
  // Atomic: only join if not cancelled, in the future, not full, not already in.
  const cls = await GymClass.findOneAndUpdate(
    {
      _id: req.params.id,
      isCancelled: false,
      startsAt: { $gt: new Date() },
      attendees: { $ne: req.user._id },
      $expr: { $lt: [{ $size: { $ifNull: ['$attendees', []] } }, '$capacity'] },
    },
    { $addToSet: { attendees: req.user._id } },
    { new: true },
  );
  if (!cls) {
    const existing = await GymClass.findById(req.params.id);
    if (!existing || existing.isCancelled) throw new AppError('Class not found', 404);
    if (existing.attendees.some(a => a.toString() === req.user._id.toString())) throw new AppError('You already joined this class', 409);
    if (existing.startsAt <= new Date()) throw new AppError('This class has already started', 400);
    throw new AppError('This class is full', 409);
  }
  ApiResponse.success(res, { class: cls }, 'You joined the class');
}));

router.post('/:id/leave', authorize('client'), wrap(async (req, res) => {
  const cls = await GymClass.findByIdAndUpdate(req.params.id, { $pull: { attendees: req.user._id } }, { new: true });
  if (!cls) throw new AppError('Class not found', 404);
  ApiResponse.success(res, { class: cls }, 'You left the class');
}));

router.put('/:id/attendance', authorize('coach', 'admin'), validate(attendanceBody), wrap(async (req, res) => {
  const cls = await GymClass.findById(req.params.id);
  if (!cls) throw new AppError('Class not found', 404);
  if (!canManage(req.user, cls)) throw new AppError('Not your class', 403);
  const { userId, present } = req.body;
  if (!cls.attendees.some(a => a.toString() === userId)) throw new AppError('Member is not booked in this class', 400);
  cls.attended = cls.attended.filter(a => a.toString() !== userId);
  if (present) cls.attended.push(userId);
  await cls.save();
  ApiResponse.success(res, { class: cls });
}));

// Roster for the coach (names of booked members + who checked in).
router.get('/:id/roster', authorize('coach', 'admin'), wrap(async (req, res) => {
  const cls = await GymClass.findById(req.params.id).populate('attendees', 'name email phone avatar');
  if (!cls) throw new AppError('Class not found', 404);
  if (!canManage(req.user, cls)) throw new AppError('Not your class', 403);
  ApiResponse.success(res, { class: cls });
}));

module.exports = router;
