'use strict';

const { Router } = require('express');
const ctrl = require('./auth.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');
const v = require('./auth.validation');

const router = Router();

router.post('/auth/register',         authLimiter, validate(v.register),        ctrl.register);
router.post('/auth/login',            authLimiter, validate(v.login),           ctrl.login);
router.post('/auth/refresh',                        validate(v.refreshToken),    ctrl.refresh);
router.post('/auth/logout',           protect,                                  ctrl.logout);
router.get ('/auth/me',               protect,                                  ctrl.me);
router.put ('/auth/change-password',  protect,     validate(v.changePassword),  ctrl.changePassword);

module.exports = router;
