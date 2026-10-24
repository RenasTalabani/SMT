'use strict';
const mongoose = require('mongoose');

// Gym shop item (supplements, drinks, gear, memberships).
const productSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true, maxlength: 100 },
    nameAr: { type: String, trim: true, maxlength: 100 },
    nameKu: { type: String, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 1000 },
    category: {
      type: String,
      enum: ['supplement', 'drink', 'gear', 'apparel', 'membership', 'other'],
      default: 'supplement',
      index: true,
    },
    price:    { type: Number, required: true, min: 0 },   // in IQD
    currency: { type: String, default: 'IQD' },
    stock:    { type: Number, default: 0, min: 0 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
