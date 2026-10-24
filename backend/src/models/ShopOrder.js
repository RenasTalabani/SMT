'use strict';
const mongoose = require('mongoose');

// A member's shop order — paid and collected at the gym reception.
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name:     { type: String, required: true },   // snapshot at order time
        price:    { type: Number, required: true },   // snapshot at order time
        quantity: { type: Number, required: true, min: 1, max: 50 },
      },
    ],
    total:    { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'IQD' },
    status: {
      type: String,
      enum: ['pending', 'ready', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    note: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopOrder', orderSchema);
