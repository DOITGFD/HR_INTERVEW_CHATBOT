// routes/auth.js
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

// ── Helpers ───────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendAuth = (res, statusCode, user) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ token, user });
};

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.array()[0].msg });

      const { name, email, password } = req.body;
      if (await User.findOne({ email }))
        return res.status(409).json({ error: 'Email already registered' });

      const user = await User.create({ name, email, password });
      sendAuth(res, 201, user);
    } catch (err) { next(err); }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.array()[0].msg });

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password)))
        return res.status(401).json({ error: 'Invalid email or password' });

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      sendAuth(res, 200, user);
    } catch (err) { next(err); }
  }
);

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', protect, (req, res) => res.json({ user: req.user }));

// ── PUT /api/auth/update ──────────────────────────────────────
router.put('/update', protect,
  [body('name').optional().trim().notEmpty()],
  async (req, res, next) => {
    try {
      const { name } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user._id, { name }, { new: true, runValidators: true }
      );
      res.json({ user });
    } catch (err) { next(err); }
  }
);

// ── PUT /api/auth/change-password ────────────────────────────
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ error: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
