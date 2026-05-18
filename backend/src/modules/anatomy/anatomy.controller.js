'use strict';
const anatomyService = require('./anatomy.service');
const ApiResponse    = require('../../utils/ApiResponse');

exports.getAll = async (req, res, next) => {
  try {
    const { type, region, search, page, limit } = req.query;
    const result = await anatomyService.getAll({ type, region, search, page, limit });
    ApiResponse.paginated(res, result.parts, result.total, result.page, result.limit);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const part = await anatomyService.getById(req.params.id);
    ApiResponse.success(res, part);
  } catch (e) { next(e); }
};

exports.getByPartId = async (req, res, next) => {
  try {
    const part = await anatomyService.getByPartId(req.params.partId);
    ApiResponse.success(res, part);
  } catch (e) { next(e); }
};

exports.getByType = async (req, res, next) => {
  try {
    const parts = await anatomyService.getByType(req.params.type);
    ApiResponse.success(res, { parts, count: parts.length });
  } catch (e) { next(e); }
};

exports.getByRegion = async (req, res, next) => {
  try {
    const parts = await anatomyService.getByRegion(req.params.region);
    ApiResponse.success(res, { parts, count: parts.length });
  } catch (e) { next(e); }
};
