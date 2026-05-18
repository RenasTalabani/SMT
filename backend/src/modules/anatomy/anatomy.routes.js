'use strict';
const router     = require('express').Router();
const ctrl       = require('./anatomy.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All anatomy routes require authentication
router.use(protect);

router.get('/',                    ctrl.getAll);
router.get('/type/:type',          ctrl.getByType);
router.get('/region/:region',      ctrl.getByRegion);
router.get('/part/:partId',        ctrl.getByPartId);
router.get('/:id',                 ctrl.getById);

module.exports = router;
