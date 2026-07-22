// middleware/auth.js — JWT protection middleware
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — requires valid Bearer token
 * Attaches req.user = full User document (no password)
 */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Not authorized — no token provided' });

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User no longer exists' });

    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
};

/**
 * adminOnly — must be called AFTER protect
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { protect, adminOnly };
