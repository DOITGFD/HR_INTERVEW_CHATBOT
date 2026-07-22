// models/Question.js — Admin question bank
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text:       { type: String, required: true, trim: true },
  domain:     { type: String, enum: ['hr','technical','coding','custom'], required: true },
  difficulty: { type: String, enum: ['Easy','Medium','Hard'], required: true },
  tags:       [{ type: String }],
  active:     { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

questionSchema.index({ domain: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);
