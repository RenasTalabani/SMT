'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  stripePaymentIntentId: { type: String, unique: true, sparse: true },
  stripeCustomerId: { type: String },
  amount: { type: Number, required: true },        // in cents
  currency: { type: String, default: 'usd' },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true,
  },
  type: {
    type: String,
    enum: ['booking', 'subscription', 'one_time'],
    default: 'booking',
  },
  description: { type: String },
  metadata: { type: Map, of: String },
  refundId: { type: String },
  refundedAt: { type: Date },
  refundAmount: { type: Number },
  receiptUrl: { type: String },
  invoiceId: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

paymentSchema.virtual('amountFormatted').get(function () {
  return `${(this.amount / 100).toFixed(2)} ${this.currency.toUpperCase()}`;
});

paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
