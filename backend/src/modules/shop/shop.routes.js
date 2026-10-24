'use strict';

// Gym shop: members browse products and place pick-up orders (pay at
// reception). Admins manage products and move orders through their states.

const { Router } = require('express');
const Joi = require('joi');
const Product = require('../../models/Product');
const ShopOrder = require('../../models/ShopOrder');
const ApiResponse = require('../../utils/ApiResponse');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const { validate, objectId } = require('../../middlewares/validate.middleware');
const { AppError } = require('../../middlewares/error.middleware');

const router = Router();

const productBody = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  nameAr: Joi.string().trim().max(100).allow(''),
  nameKu: Joi.string().trim().max(100).allow(''),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('supplement', 'drink', 'gear', 'apparel', 'membership', 'other').default('supplement'),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
  imageUrl: Joi.string().uri().allow(''),
  isActive: Joi.boolean().default(true),
});

const orderBody = Joi.object({
  items: Joi.array().items(Joi.object({
    productId: objectId.required(),
    quantity: Joi.number().integer().min(1).max(50).required(),
  })).min(1).max(30).required(),
  note: Joi.string().max(300).allow(''),
});

const statusBody = Joi.object({
  status: Joi.string().valid('pending', 'ready', 'completed', 'cancelled').required(),
});

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Products ────────────────────────────────────────────────────────────────
router.get('/products', wrap(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.category = String(req.query.category);
  const products = await Product.find(filter).sort({ category: 1, name: 1 }).limit(200).lean();
  ApiResponse.success(res, { products });
}));

router.get('/products/all', protect, authorize('admin'), wrap(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).limit(500).lean();
  ApiResponse.success(res, { products });
}));

router.post('/products', protect, authorize('admin'), validate(productBody), wrap(async (req, res) => {
  const product = await Product.create(req.body);
  ApiResponse.created(res, { product });
}));

router.put('/products/:id', protect, authorize('admin'), validate(productBody), wrap(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw new AppError('Product not found', 404);
  ApiResponse.success(res, { product });
}));

router.delete('/products/:id', protect, authorize('admin'), wrap(async (req, res) => {
  // Soft-delete so old orders keep their history.
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw new AppError('Product not found', 404);
  ApiResponse.success(res, {}, 'Product hidden from the shop');
}));

// ── Orders ──────────────────────────────────────────────────────────────────
router.post('/orders', protect, validate(orderBody), wrap(async (req, res) => {
  const reserved = []; // [{ id, qty }] to roll back if something fails
  try {
    const items = [];
    for (const { productId, quantity } of req.body.items) {
      // Atomically take stock only if enough is left.
      const p = await Product.findOneAndUpdate(
        { _id: productId, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!p) {
        const exists = await Product.findById(productId).lean();
        throw new AppError(exists && exists.isActive ? `Not enough stock for ${exists.name}` : 'Product not available', 400);
      }
      reserved.push({ id: p._id, qty: quantity });
      items.push({ product: p._id, name: p.name, price: p.price, quantity });
    }
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await ShopOrder.create({ user: req.user._id, items, total, note: req.body.note });
    ApiResponse.created(res, { order }, 'Order placed — pay and collect at reception');
  } catch (err) {
    await Promise.all(reserved.map(r => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
    throw err;
  }
}));

router.get('/orders/my', protect, wrap(async (req, res) => {
  const orders = await ShopOrder.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
  ApiResponse.success(res, { orders });
}));

router.get('/orders', protect, authorize('admin'), wrap(async (req, res) => {
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  const orders = await ShopOrder.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 }).limit(200).lean();
  ApiResponse.success(res, { orders });
}));

router.put('/orders/:id/status', protect, validate(statusBody), wrap(async (req, res) => {
  const order = await ShopOrder.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  const isOwner = order.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const { status } = req.body;
  // Members may only cancel their own pending order.
  if (!isAdmin && !(isOwner && status === 'cancelled' && order.status === 'pending')) {
    throw new AppError('Not allowed', 403);
  }
  if (order.status === 'cancelled' || order.status === 'completed') {
    throw new AppError(`Order is already ${order.status}`, 400);
  }
  if (status === 'cancelled') {
    await Promise.all(order.items.map(i => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
  }
  order.status = status;
  await order.save();
  ApiResponse.success(res, { order });
}));

module.exports = router;
