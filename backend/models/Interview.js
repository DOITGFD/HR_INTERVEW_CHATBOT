// models/Interview.js
const mongoose = require('mongoose');

// Sub-schema: AI evaluation per answer
const evaluationSchema = new mongoose.Schema({
  score:           { type: Number, min: 0, max: 10 },
  strengths:       [{ type: String }],
  weaknesses:      [{ type: String }],
  improved_answer: { type: String },
  summary:         { type: String },
}, { _id: false });

// Sub-schema: one question + answer + evaluation
const qaSchema = new mongoose.Schema({
  question:   { type: String, required: true },
  answer:     { type: String, default: '' },
  evaluation: { type: evaluationSchema, default: null },
  timeSpent:  { type: Number, default: 0 },   // seconds taken
  skipped:    { type: Boolean, default: false },
  answeredAt: { type: Date },
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true,
  },
  domain:      { type: String, enum: ['hr','technical','coding','custom'], required: true },
  customTopic: { type: String, default: '' },
  difficulty:  { type: String, enum: ['Easy','Medium','Hard'], required: true },
  status:      { type: String, enum: ['in_progress','completed','abandoned'], default: 'in_progress' },
  qa:          [qaSchema],
  overallScore:{ type: Number, default: null },  // computed on completion
  totalQuestions: { type: Number },
  duration:    { type: Number, default: 0 },     // total seconds
  completedAt: { type: Date },
}, { timestamps: true });

// Virtual: domain label
interviewSchema.virtual('domainLabel').get(function () {
  const map = { hr:'HR Behavioral', technical:'Technical', coding:'Coding Round', custom: this.customTopic || 'Custom' };
  return map[this.domain] || this.domain;
});

// Auto-compute overallScore before save when status=completed
interviewSchema.pre('save', function (next) {
  if (this.status === 'completed') {
    const scored = this.qa.filter(q => q.evaluation?.score != null);
    if (scored.length) {
      const sum = scored.reduce((a, q) => a + q.evaluation.score, 0);
      this.overallScore = Math.round((sum / scored.length) * 10) / 10;
    }
    if (!this.completedAt) this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Interview', interviewSchema);
