// routes/admin.js
const router   = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const User      = require('../models/User');
const Interview = require('../models/Interview');
const Question  = require('../models/Question');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalInterviews, completedCount] = await Promise.all([
      User.countDocuments(),
      Interview.countDocuments(),
      Interview.countDocuments({ status: 'completed' }),
    ]);
    const avgResult = await Interview.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$overallScore' } } },
    ]);
    const domainBreakdown = await Interview.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 }, avgScore: { $avg: '$overallScore' } } },
    ]);
    res.json({
      totalUsers,
      totalInterviews,
      completedCount,
      completionRate: totalInterviews ? Math.round(completedCount / totalInterviews * 100) : 0,
      averageScore:   avgResult[0]?.avg?.toFixed(1) || '0.0',
      byDomain:       domainBreakdown,
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/users ──────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (err) { next(err); }
});

// ── PUT /api/admin/users/:id/role ─────────────────────────────
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student','admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ user });
  } catch (err) { next(err); }
});

// ── GET /api/admin/questions ──────────────────────────────────
router.get('/questions', async (req, res, next) => {
  try {
    const { domain, difficulty } = req.query;
    const filter = {};
    if (domain) filter.domain = domain;
    if (difficulty) filter.difficulty = difficulty;
    const questions = await Question.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) { next(err); }
});

// ── POST /api/admin/questions ─────────────────────────────────
router.post('/questions', async (req, res, next) => {
  try {
    const { text, domain, difficulty, tags } = req.body;
    if (!text || !domain || !difficulty)
      return res.status(400).json({ error: 'text, domain, difficulty required' });
    const question = await Question.create({ text, domain, difficulty, tags, createdBy: req.user._id });
    res.status(201).json(question);
  } catch (err) { next(err); }
});

// ── PUT /api/admin/questions/:id ──────────────────────────────
router.put('/questions/:id', async (req, res, next) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ error: 'Not found' });
    res.json(q);
  } catch (err) { next(err); }
});

// ── DELETE /api/admin/questions/:id ──────────────────────────
router.delete('/questions/:id', async (req, res, next) => {
  try {
    await Question.deleteOne({ _id: req.params.id });
    res.json({ message: 'Question deleted' });
  } catch (err) { next(err); }
});

// ── GET /api/admin/interviews — all platform interviews ───────
router.get('/interviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const interviews = await Interview.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('userId domain difficulty status overallScore createdAt completedAt');
    const total = await Interview.countDocuments();
    res.json({ interviews, total });
  } catch (err) { next(err); }
});

module.exports = router;
