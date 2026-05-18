'use strict';
const mongoose = require('mongoose');

const bodyPartSchema = new mongoose.Schema(
  {
    partId: { type: String, required: true, unique: true, trim: true },
    name:   { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true },
    nameKu: { type: String, trim: true },

    type: {
      type: String,
      required: true,
      enum: ['muscle', 'joint', 'artery', 'nerve', 'organ'],
      index: true,
    },

    region: {
      type: String,
      enum: ['upper_body', 'lower_body', 'core', 'head_neck', 'full_body'],
      index: true,
    },

    side: {
      type: String,
      enum: ['both', 'left', 'right', 'center'],
      default: 'both',
    },

    // Educational content
    description:  { type: String },
    function:     { type: String },
    origin:       { type: String }, // anatomy: where muscle attaches from
    insertion:    { type: String }, // anatomy: where muscle attaches to
    innervation:  { type: String }, // which nerve controls it

    // Fitness content
    relatedExercises: [{ type: String }],
    antagonistMuscles: [{ type: String }],  // opposing muscle groups
    synergistMuscles:  [{ type: String }],  // helper muscles

    // Injury & recovery
    injuryRisks:  [{ type: String }],
    symptoms:     [{ type: String }],
    recoveryTips: [{ type: String }],
    warmUpTips:   [{ type: String }],

    // Media
    videoUrl:       { type: String },
    imageUrl:       { type: String },
    modelHighlight: { type: String }, // mesh ID in 3D model

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

bodyPartSchema.index({ type: 1, region: 1 });
bodyPartSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('BodyPart', bodyPartSchema);
