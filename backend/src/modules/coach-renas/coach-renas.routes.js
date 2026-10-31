'use strict';

// Coach Renas module — Renas's personal coaching brand inside City Gym.
//   Public:  price list (plans, programs, 1-on-1 coaching)
//   Client:  free trial, purchase (pending until confirmed), profile, weekly check-ins
//   Coach:   panel — clients, payments to confirm, check-in replies, content planner
// Payments are PLACEHOLDERS (see payment-providers.js): nothing charges money.

const { Router } = require('express');
const Joi = require('joi');
const crypto = require('crypto');
const User = require('../../../models/User');
const {
  CoachRenasSubscription: Sub, CoachRenasClient: Client, CoachRenasCheckIn: CheckIn, CoachRenasContent: Content,
  CoachRenasOrder: Order,
} = require('../../models/CoachRenas');
const Notification = require('../../../models/Notification');
const shop = require('./shop-catalog');
const plans = require('./plans');
const providers = require('./payment-providers');
const contentSeed = require('./content-seed');
const ApiResponse = require('../../utils/ApiResponse');
const { protect } = require('../../middlewares/auth.middleware');
const { validate, objectId } = require('../../middlewares/validate.middleware');
const { AppError } = require('../../middlewares/error.middleware');

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const DAY = 86400000;
const TIER_RANK = { training: 1, food: 2, all: 3 };

// In-app notification for the member (never blocks the request).
async function notify(userId, title, message, category = 'system', type = 'coach_feedback', data = {}) {
  try {
    await Notification.create({
      recipient: userId, type, category, title: title.slice(0, 100), message: String(message).slice(0, 500),
      priority: 'medium', actionUrl: '/renas', data: { customData: { source: 'coach_renas', ...data } },
    });
  } catch (err) {
    console.error('[coach-renas] notification failed:', err.message);
  }
}

// Who may open the coach panel: admins, and coaches. If COACH_RENAS_COACH_EMAILS
// is set (comma list), only those coaches.
function isStaff(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'coach') return false;
  const allow = (process.env.COACH_RENAS_COACH_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allow.length === 0 || allow.includes(String(user.email || '').toLowerCase());
}
function staffOnly(req, res, next) {
  if (!isStaff(req.user)) return next(new AppError('Coach Renas panel only', 403));
  next();
}

// What a user can open right now.
async function accessFor(userId) {
  const now = new Date();
  const subs = await Sub.find({ user: userId, status: 'active', endsAt: { $gt: now } }).lean();
  let tier = null; let coaching = false; let trialEndsAt = null; const programs = [];
  for (const s of subs) {
    if (s.kind === 'coaching') { coaching = true; tier = 'all'; }
    if (s.kind === 'trial') { trialEndsAt = s.endsAt; if (!tier || TIER_RANK.all > TIER_RANK[tier]) tier = 'all'; }
    if (s.kind === 'tier' && (!tier || TIER_RANK[s.key] > TIER_RANK[tier])) tier = s.key;
    if (s.kind === 'program') programs.push(s.key);
  }
  return { tier, coaching, trialEndsAt, programs, allPrograms: tier === 'all' };
}

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/plans', (req, res) => {
  ApiResponse.success(res, {
    currency: plans.currency,
    priceDate: plans.priceDate,
    freeTrialDays: plans.FREE_TRIAL_DAYS,
    tiers: plans.TIERS,
    periods: plans.PERIODS,
    programs: plans.PROGRAMS,
    coaching: plans.COACHING,
    paymentMethods: providers.status(),
    storeProductIds: plans.storeProductIds(),
  });
});

// Shop catalogue (SAMPLE prices) — the phone shows these; totals are computed here.
router.get('/shop', (req, res) => {
  ApiResponse.success(res, { products: shop.PRODUCTS, delivery: shop.DELIVERY_IQD, governorates: shop.GOVS, currency: 'IQD' });
});

// ── Client ───────────────────────────────────────────────────────────────────
router.get('/me', protect, wrap(async (req, res) => {
  const [subscriptions, profile, access] = await Promise.all([
    Sub.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Client.findOne({ user: req.user._id }).lean(),
    accessFor(req.user._id),
  ]);
  ApiResponse.success(res, { subscriptions, profile, access, isCoach: isStaff(req.user) });
}));

router.post('/trial', protect, wrap(async (req, res) => {
  const used = await Sub.exists({ user: req.user._id, kind: 'trial' });
  if (used) throw new AppError('Free trial already used', 409);
  const now = new Date();
  const sub = await Sub.create({
    user: req.user._id, kind: 'trial', key: 'all', period: 'trial', amount: 0, channel: 'free', method: 'free',
    status: 'active', startsAt: now, endsAt: new Date(now.getTime() + plans.FREE_TRIAL_DAYS * DAY),
  });
  ApiResponse.created(res, { subscription: sub, access: await accessFor(req.user._id) }, 'Free trial started');
}));

const purchaseBody = Joi.object({
  kind: Joi.string().valid('tier', 'program', 'coaching').required(),
  key: Joi.string().max(40).required(),
  period: Joi.string().valid('m1', 'm3', 'm6', 'm12', 'once').required(),
  method: Joi.string().valid(...plans.STORE_METHODS, ...plans.DIRECT_METHODS).required(),
  receiptUrl: Joi.string().max(500).pattern(/^(https?:\/\/|\/)[^\s]*$/).allow(''),
  storeToken: Joi.string().max(2000).allow(''),
  note: Joi.string().max(500).allow(''),
});

router.post('/purchase', protect, validate(purchaseBody), wrap(async (req, res) => {
  const item = plans.resolveItem(req.body);
  if (!item) throw new AppError('Unknown plan', 400);
  const { method } = req.body;
  // Store rules: digital content inside the app -> store billing only;
  // 1-on-1 coaching -> paid directly to the coach.
  if (item.channel === 'store' && !plans.STORE_METHODS.includes(method)) {
    throw new AppError('This plan is sold through Google Play / App Store inside the app', 400);
  }
  if (item.channel === 'direct' && !plans.DIRECT_METHODS.includes(method)) {
    throw new AppError('1-on-1 coaching is paid directly to the coach (ZainCash, FIB, Qi Card, transfer or cash)', 400);
  }
  if (item.kind === 'coaching') {
    const taken = await Sub.distinct('user', { kind: 'coaching', status: 'active', endsAt: { $gt: new Date() } });
    if (taken.length >= plans.COACHING.spots && !taken.some((u) => String(u) === String(req.user._id))) {
      throw new AppError('Coaching is full right now', 409);
    }
  }
  const reference = `CR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const sub = await Sub.create({
    user: req.user._id, ...item, method, status: 'pending', reference,
    receiptUrl: req.body.receiptUrl || undefined, storeToken: req.body.storeToken || undefined, note: req.body.note || undefined,
  });
  const payment = item.channel === 'store'
    ? { ...(await providers.verifyStorePurchase({ method })), status: 'pending' }
    : await providers.startPayment({ method, amount: item.amount, reference });
  ApiResponse.created(res, {
    subscription: sub,
    productId: item.productId || null,
    payment,
    transferAccounts: item.channel === 'direct' ? providers.transferAccounts() : [],
  }, 'Waiting for the coach to confirm');
}));

router.put('/subscriptions/:id/receipt', protect, validate(Joi.object({
  receiptUrl: Joi.string().max(500).pattern(/^(https?:\/\/|\/)[^\s]*$/).required(),
})), wrap(async (req, res) => {
  const sub = await Sub.findOne({ _id: req.params.id, user: req.user._id, status: 'pending' });
  if (!sub) throw new AppError('Pending payment not found', 404);
  sub.receiptUrl = req.body.receiptUrl;
  await sub.save();
  ApiResponse.success(res, { subscription: sub });
}));

const profileBody = Joi.object({
  goal: Joi.string().valid('strength', 'muscle', 'fat', 'fit', 'sport'),
  level: Joi.string().valid('beg', 'mid', 'adv'),
  days: Joi.number().integer().min(2).max(6),
  place: Joi.string().valid('gym', 'db', 'bands', 'none'),
  injuries: Joi.array().items(Joi.string().max(40)).max(10),
  parqFlag: Joi.boolean(),
  sex: Joi.string().valid('m', 'f'),
  age: Joi.number().min(10).max(100),
  kg: Joi.number().min(25).max(300),
  cm: Joi.number().min(100).max(250),
});
router.put('/profile', protect, validate(profileBody), wrap(async (req, res) => {
  const profile = await Client.findOneAndUpdate(
    { user: req.user._id }, { $set: req.body }, { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  ApiResponse.success(res, { profile });
}));

const checkInBody = Joi.object({
  kg: Joi.number().min(25).max(300),
  sleep: Joi.number().integer().min(1).max(5),
  energy: Joi.number().integer().min(1).max(5),
  workoutsDone: Joi.number().integer().min(0).max(14),
  note: Joi.string().max(1000).allow(''),
  photoUrl: Joi.string().max(500).pattern(/^(https?:\/\/|\/)[^\s]*$/).allow(''),
});
router.post('/checkins', protect, validate(checkInBody), wrap(async (req, res) => {
  const checkIn = await CheckIn.create({ ...req.body, user: req.user._id });
  ApiResponse.created(res, { checkIn }, 'Sent to the coach');
}));
router.get('/checkins/me', protect, wrap(async (req, res) => {
  const checkIns = await CheckIn.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(52).lean();
  ApiResponse.success(res, { checkIns });
}));

// ── Shop orders ──────────────────────────────────────────────────────────────
const orderBody = Joi.object({
  items: Joi.array().items(Joi.object({
    key: Joi.string().max(40).required(),
    quantity: Joi.number().integer().min(1).max(20).required(),
  })).min(1).max(20).required(),
  governorate: Joi.string().valid(...shop.GOVS).required(),
  phone: Joi.string().trim().pattern(/^07\d{9}$/).required()
    .messages({ 'string.pattern.base': 'Phone must start with 07 and have 11 digits' }),
  address: Joi.string().max(300).allow(''),
  method: Joi.string().valid('cod', 'qi', 'wallet').default('cod'),
  note: Joi.string().max(300).allow(''),
});
router.post('/orders', protect, validate(orderBody), wrap(async (req, res) => {
  const items = req.body.items.map(({ key, quantity }) => {
    const p = shop.PRODUCTS.find((x) => x.key === key);
    if (!p) throw new AppError(`Unknown product: ${key}`, 400);
    return { key, name: p.name, price: p.price, quantity };
  });
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const order = await Order.create({
    user: req.user._id, items, subtotal, delivery: shop.DELIVERY_IQD, total: subtotal + shop.DELIVERY_IQD,
    governorate: req.body.governorate, phone: req.body.phone, address: req.body.address || undefined,
    method: req.body.method, note: req.body.note || undefined,
  });
  ApiResponse.created(res, { order }, 'Order received — we will call or WhatsApp you to confirm');
}));
router.get('/orders/me', protect, wrap(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  ApiResponse.success(res, { orders });
}));
router.patch('/orders/:id/cancel', protect, wrap(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'pending') throw new AppError('Only a pending order can be cancelled', 409);
  order.status = 'cancelled';
  await order.save();
  ApiResponse.success(res, { order });
}));

// ── Coach panel ──────────────────────────────────────────────────────────────
const panel = Router();
panel.use(protect, staffOnly);

async function clientRows() {
  const userIds = await Sub.distinct('user', { status: { $in: ['active', 'pending'] }, kind: { $ne: 'trial' } });
  const profiles = await Client.find({}).select('user').lean();
  const ids = [...new Set([...userIds.map(String), ...profiles.map((p) => String(p.user))])];
  const users = await User.find({ _id: { $in: ids } }).select('name email phone avatar').lean();
  const now = Date.now();
  return Promise.all(users.map(async (u) => {
    const [last, count, subs, profile] = await Promise.all([
      CheckIn.findOne({ user: u._id }).sort({ createdAt: -1 }).lean(),
      CheckIn.countDocuments({ user: u._id }),
      Sub.find({ user: u._id, status: 'active', endsAt: { $gt: new Date() } }).lean(),
      Client.findOne({ user: u._id }).lean(),
    ]);
    const daysSince = last ? Math.floor((now - new Date(last.createdAt).getTime()) / DAY) : null;
    return {
      user: u,
      profile,
      coaching: subs.some((s) => s.kind === 'coaching'),
      plan: subs.map((s) => `${s.kind}:${s.key}`).join(', '),
      checkIns: count,
      lastCheckIn: last,
      daysSinceCheckIn: daysSince,
      needsAttention: daysSince === null ? count === 0 && subs.some((s) => s.kind === 'coaching') : daysSince >= 14,
      unanswered: !!(last && !last.reply),
    };
  }));
}

panel.get('/summary', wrap(async (req, res) => {
  const rows = await clientRows();
  const pendingPayments = await Sub.countDocuments({ status: 'pending', kind: { $ne: 'trial' } });
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  ApiResponse.success(res, {
    clients: rows.length,
    coachingClients: rows.filter((r) => r.coaching).length,
    needsAttention: rows.filter((r) => r.needsAttention).length,
    unanswered: rows.filter((r) => r.unanswered).length,
    pendingPayments,
    pendingOrders,
    coachingSpots: plans.COACHING.spots,
  });
}));

panel.get('/clients', wrap(async (req, res) => {
  const rows = await clientRows();
  rows.sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention) || Number(b.unanswered) - Number(a.unanswered));
  ApiResponse.success(res, { clients: rows });
}));

panel.get('/clients/:userId', validate(Joi.object({ userId: objectId.required() }), 'params'), wrap(async (req, res) => {
  const user = await User.findById(req.params.userId).select('name email phone avatar').lean();
  if (!user) throw new AppError('Client not found', 404);
  const [profile, subscriptions, checkIns, access] = await Promise.all([
    Client.findOne({ user: user._id }).lean(),
    Sub.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
    CheckIn.find({ user: user._id }).sort({ createdAt: -1 }).limit(52).lean(),
    accessFor(user._id),
  ]);
  ApiResponse.success(res, { user, profile, subscriptions, checkIns, access });
}));

panel.put('/clients/:userId', validate(Joi.object({
  programKey: Joi.string().max(40).allow(''),
  coachNote: Joi.string().max(2000).allow(''),
})), wrap(async (req, res) => {
  const exists = await User.exists({ _id: req.params.userId });
  if (!exists) throw new AppError('Client not found', 404);
  const profile = await Client.findOneAndUpdate(
    { user: req.params.userId }, { $set: req.body }, { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  ApiResponse.success(res, { profile });
}));

panel.get('/payments', wrap(async (req, res) => {
  const status = ['pending', 'active', 'rejected', 'expired', 'cancelled'].includes(req.query.status) ? req.query.status : 'pending';
  const payments = await Sub.find({ status, kind: { $ne: 'trial' } })
    .populate('user', 'name email phone').sort({ createdAt: -1 }).limit(200).lean();
  ApiResponse.success(res, { payments });
}));

panel.patch('/payments/:id', validate(Joi.object({
  decision: Joi.string().valid('approve', 'reject').required(),
  note: Joi.string().max(500).allow(''),
})), wrap(async (req, res) => {
  const sub = await Sub.findById(req.params.id);
  if (!sub) throw new AppError('Payment not found', 404);
  if (sub.status !== 'pending') throw new AppError('Already decided', 409);
  const now = new Date();
  sub.decidedBy = req.user._id;
  sub.decidedAt = now;
  if (req.body.note) sub.note = req.body.note;
  if (req.body.decision === 'approve') {
    // Extend from the end of a running subscription of the same kind/key.
    const running = await Sub.findOne({
      user: sub.user, kind: sub.kind, key: sub.key, status: 'active', endsAt: { $gt: now },
    }).sort({ endsAt: -1 });
    const start = running ? running.endsAt : now;
    const end = new Date(start);
    end.setMonth(end.getMonth() + ({ m1: 1, m3: 3, m6: 6, m12: 12 }[sub.period] || 3));
    sub.status = 'active';
    sub.startsAt = start;
    sub.endsAt = end;
  } else {
    sub.status = 'rejected';
  }
  await sub.save();
  await notify(
    sub.user,
    sub.status === 'active' ? 'Coach Renas: payment confirmed' : 'Coach Renas: payment not accepted',
    sub.status === 'active'
      ? `تأكد · انفتح الاشتراك — ${sub.kind}:${sub.key} (${sub.amount} IQD)`
      : `انرفض — ${sub.kind}:${sub.key}. ${req.body.note || 'Contact the coach.'}`,
    'payment', 'payment_received', { subscription: String(sub._id) },
  );
  ApiResponse.success(res, { subscription: sub }, sub.status === 'active' ? 'Confirmed — access opened' : 'Rejected');
}));

panel.post('/checkins/:id/reply', validate(Joi.object({ reply: Joi.string().trim().min(1).max(2000).required() })), wrap(async (req, res) => {
  const checkIn = await CheckIn.findByIdAndUpdate(
    req.params.id, { reply: req.body.reply, repliedAt: new Date() }, { new: true },
  );
  if (!checkIn) throw new AppError('Check-in not found', 404);
  await notify(checkIn.user, 'رد الكوتش على تقريرك', req.body.reply, 'progress', 'coach_feedback', { checkIn: String(checkIn._id) });
  ApiResponse.success(res, { checkIn }, 'Reply sent');
}));

panel.get('/orders', wrap(async (req, res) => {
  const filter = req.query.status ? { status: String(req.query.status) } : { status: { $in: ['pending', 'confirmed', 'shipped'] } };
  const orders = await Order.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 }).limit(200).lean();
  ApiResponse.success(res, { orders });
}));
panel.patch('/orders/:id', validate(Joi.object({
  status: Joi.string().valid('confirmed', 'shipped', 'delivered', 'cancelled').required(),
})), wrap(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (['delivered', 'cancelled'].includes(order.status)) throw new AppError('Order is closed', 409);
  order.status = req.body.status;
  await order.save();
  const ar = { confirmed: 'تأكد طلبك', shipped: 'طلبك بالطريق', delivered: 'وصل طلبك', cancelled: 'انلغى طلبك' }[order.status];
  await notify(order.user, `Coach Renas shop: ${order.status}`, `${ar} · ${order.total} IQD`, 'system', 'system_announcement', { order: String(order._id) });
  ApiResponse.success(res, { order });
}));

panel.get('/providers', (req, res) => {
  ApiResponse.success(res, { providers: providers.status(), transferAccounts: providers.transferAccounts() });
});

// Content planner (Instagram). First open fills it with the 2-week plan.
const contentBody = Joi.object({
  pillar: Joi.string().valid('bjj', 'building', 'discipline', 'life', 'engage').required(),
  day: Joi.string().max(20).allow(''),
  date: Joi.date().allow(null),
  format: Joi.string().valid('reel', 'photo', 'carousel', 'story'),
  idea: Joi.string().trim().min(2).max(300).required(),
  caption: Joi.string().max(2200).allow(''),
  status: Joi.string().valid('idea', 'filmed', 'posted'),
  order: Joi.number().integer().min(0).max(10000),
});
panel.get('/content', wrap(async (req, res) => {
  if ((await Content.estimatedDocumentCount()) === 0) await Content.insertMany(contentSeed);
  const items = await Content.find({}).sort({ order: 1, createdAt: 1 }).lean();
  ApiResponse.success(res, { items });
}));
panel.post('/content', validate(contentBody), wrap(async (req, res) => {
  const item = await Content.create(req.body);
  ApiResponse.created(res, { item });
}));
panel.put('/content/:id', validate(contentBody.fork(['pillar', 'idea'], (s) => s.optional())), wrap(async (req, res) => {
  const item = await Content.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!item) throw new AppError('Not found', 404);
  ApiResponse.success(res, { item });
}));
panel.delete('/content/:id', wrap(async (req, res) => {
  const item = await Content.findByIdAndDelete(req.params.id);
  if (!item) throw new AppError('Not found', 404);
  ApiResponse.success(res, {}, 'Deleted');
}));

router.use('/panel', panel);

module.exports = router;
module.exports.isStaff = isStaff;
module.exports.accessFor = accessFor;
