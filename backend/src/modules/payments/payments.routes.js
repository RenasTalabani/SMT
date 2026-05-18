'use strict';

const express = require('express');
const { Router } = require('express');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const ApiResponse = require('../../utils/ApiResponse');
const Payment = require('../../models/Payment');
const config = require('../../config');
const { AppError } = require('../../middlewares/error.middleware');

const router = Router();

// GET /payments/my — client payment history
router.get('/my', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const [items, total] = await Promise.all([
      Payment.find({ user: req.user._id })
        .populate('booking', 'slot type status')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(limit),
      Payment.countDocuments({ user: req.user._id }),
    ]);
    ApiResponse.paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
});

// POST /payments/create-intent — create Stripe PaymentIntent
router.post('/create-intent', protect, authorize('client'), async (req, res, next) => {
  try {
    if (!config.stripe.secretKey) throw new AppError('Payment service not configured', 503);
    const stripe = require('stripe')(config.stripe.secretKey);
    const { bookingId, amount, currency = 'usd' } = req.body;

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { bookingId: bookingId?.toString(), userId: req.user._id.toString() },
    });

    await Payment.create({
      user: req.user._id,
      booking: bookingId,
      stripePaymentIntentId: intent.id,
      amount: intent.amount,
      currency,
      status: 'pending',
      type: 'booking',
    });

    ApiResponse.success(res, { clientSecret: intent.client_secret });
  } catch (err) { next(err); }
});

// POST /payments/webhook — Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    if (!config.stripe.secretKey) return res.sendStatus(200);
    const stripe = require('stripe')(config.stripe.secretKey);
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: pi.id },
        { status: 'succeeded', receiptUrl: pi.charges?.data[0]?.receipt_url },
      );
    }
    res.sendStatus(200);
  } catch (err) { next(err); }
});

module.exports = router;
