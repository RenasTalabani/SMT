'use strict';
const BodyPart = require('../../models/BodyPart');
const { AppError } = require('../../middlewares/error.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// GET /anatomy  — list all, with optional type + region + search filters
// ─────────────────────────────────────────────────────────────────────────────
exports.getAll = async ({ type, region, search, page = 1, limit = 50 }) => {
  const filter = { isActive: true };
  if (type)   filter.type   = type;
  if (region) filter.region = region;
  if (search) filter.$text  = { $search: search };

  const skip  = (page - 1) * limit;
  const total = await BodyPart.countDocuments(filter);
  const parts = await BodyPart.find(filter)
    .sort({ region: 1, name: 1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return { parts, total, page: Number(page), limit: Number(limit) };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /anatomy/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getById = async (id) => {
  const part = await BodyPart.findById(id).lean();
  if (!part) throw new AppError('Body part not found', 404);
  return part;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /anatomy/part/:partId
// ─────────────────────────────────────────────────────────────────────────────
exports.getByPartId = async (partId) => {
  const part = await BodyPart.findOne({ partId, isActive: true }).lean();
  if (!part) throw new AppError('Body part not found', 404);
  return part;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /anatomy/type/:type
// ─────────────────────────────────────────────────────────────────────────────
exports.getByType = async (type) => {
  const parts = await BodyPart.find({ type, isActive: true })
    .sort({ region: 1, name: 1 })
    .lean();
  return parts;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /anatomy/region/:region
// ─────────────────────────────────────────────────────────────────────────────
exports.getByRegion = async (region) => {
  const parts = await BodyPart.find({ region, isActive: true })
    .sort({ type: 1, name: 1 })
    .lean();
  return parts;
};
