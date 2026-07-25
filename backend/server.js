// ============================================================
//  server.js — AI Interview Bot Backend Entry Point
// ============================================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const interviewRoutes = require('./routes/interview');
const reportRoutes    = require('./routes/report');
const adminRoutes     = require('./routes/admin');

const app = express();

// Trust first proxy for rate limiting (prevents ERL validation crash)
app.set('trust proxy', 1);

// ── Security middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests — please slow down.' },
}));

// ── Body / logging ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── MongoDB connection ────────────────────────────────────────
async function connectDB() {
  let uri = process.env.MONGO_URI;

  // If MONGO_URI is "memory", spin up an in-memory MongoDB server
  if (uri === 'memory') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('🧪 Using in-memory MongoDB for development');
  }

  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');

  // Auto-seed if database is empty (important for memory-server dev environment)
  const User = require('./models/User');
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('🌱 Database is empty. Auto-seeding admin user and questions...');
    const { seedDirect } = require('./config/seed');
    await seedDirect();
  }
}

connectDB().catch(err => {
  console.error('❌ MongoDB error:', err.message);
  process.exit(1);
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/report',    reportRoutes);
app.use('/api/admin',     adminRoutes);

// ── Health check & Root ───────────────────────────────────────
app.get('/', (_, res) => res.json({
  message: '🚀 AI Interview Bot Backend API is active',
  health: '/api/health',
}));

app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  env: process.env.NODE_ENV,
  time: new Date().toISOString(),
}));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.path} not found` }));

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API docs: http://localhost:${PORT}/api/health`);
});

module.exports = app;
