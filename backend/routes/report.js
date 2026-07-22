// routes/report.js
const router      = require('express').Router();
const PDFDocument = require('pdfkit');
const jwt         = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const Interview   = require('../models/Interview');
const User        = require('../models/User');

// ── GET /api/report/stats/me ──────────────────────────────────
router.get('/stats/me', protect, async (req, res, next) => {
  try {
    const interviews = await Interview.find({
      userId: req.user._id, status: 'completed',
    }).select('overallScore domain difficulty duration createdAt qa');

    const total = interviews.length;
    if (!total) return res.json({ total: 0, averageScore: 0, byDomain: {}, recentScores: [] });

    const avgScore = interviews.reduce((a, i) => a + (i.overallScore || 0), 0) / total;

    // Stats by domain
    const byDomain = interviews.reduce((acc, iv) => {
      if (!acc[iv.domain]) acc[iv.domain] = { count: 0, totalScore: 0 };
      acc[iv.domain].count++;
      acc[iv.domain].totalScore += iv.overallScore || 0;
      return acc;
    }, {});
    Object.keys(byDomain).forEach(d => {
      byDomain[d].avg = Math.round((byDomain[d].totalScore / byDomain[d].count) * 10) / 10;
      delete byDomain[d].totalScore;
    });

    // Score trend (last 15)
    const recentScores = interviews.slice(-15).map(i => ({
      score: i.overallScore,
      domain: i.domain,
      difficulty: i.difficulty,
      date: i.createdAt,
    }));

    // Avg by difficulty
    const byDifficulty = ['Easy','Medium','Hard'].reduce((acc, d) => {
      const group = interviews.filter(i => i.difficulty === d);
      acc[d] = group.length
        ? { count: group.length, avg: Math.round(group.reduce((a,i) => a + i.overallScore, 0) / group.length * 10) / 10 }
        : { count: 0, avg: 0 };
      return acc;
    }, {});

    res.json({
      total,
      averageScore: Math.round(avgScore * 10) / 10,
      byDomain,
      byDifficulty,
      recentScores,
    });
  } catch (err) { next(err); }
});

// ── GET /api/report/:interviewId ──────────────────────────────
router.get('/:interviewId', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.interviewId,
      userId: req.user._id,
    }).populate('userId', 'name email');

    if (!interview) return res.status(404).json({ error: 'Report not found' });

    const scored = interview.qa.filter(q => q.evaluation?.score != null);
    const scores = scored.map(q => q.evaluation.score);
    const avg    = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    res.json({
      interview,
      summary: {
        overallScore:    Math.round(avg * 10) / 10,
        grade:           avg >= 8 ? 'A' : avg >= 6 ? 'B' : avg >= 4 ? 'C' : 'D',
        totalQuestions:  interview.totalQuestions,
        answeredCount:   scored.length,
        scores,
        bestScore:       scores.length ? Math.max(...scores) : 0,
        worstScore:      scores.length ? Math.min(...scores) : 0,
        domain:          interview.domain,
        customTopic:     interview.customTopic,
        difficulty:      interview.difficulty,
        completedAt:     interview.completedAt,
        duration:        interview.duration,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/report/:interviewId/pdf ─────────────────────────
// Supports both Bearer token and ?token= query param for window.open() downloads
router.get('/:interviewId/pdf', async (req, res, next) => {
  try {
    // Auth: try header first, then query param
    let userId;
    const header = req.headers.authorization;
    const queryToken = req.query.token;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : queryToken;

    if (!token) return res.status(401).json({ error: 'Not authorized — no token provided' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      userId = user._id;
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return res.status(401).json({ error: msg });
    }

    const interview = await Interview.findOne({
      _id: req.params.interviewId, userId,
    }).populate('userId', 'name email');

    if (!interview) return res.status(404).json({ error: 'Not found' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="interview-report-${interview._id}.pdf"`);
    doc.pipe(res);

    // ── PDF Content ──────────────────────────────────────────
    const PURPLE = '#7c6fff';
    const GRAY   = '#666666';
    const GREEN  = '#16a34a';
    const RED    = '#dc2626';

    // Header banner
    doc.rect(0, 0, doc.page.width, 100).fill(PURPLE);
    doc.fill('white').fontSize(26).font('Helvetica-Bold')
       .text('AI Interview Report', 50, 30);
    doc.fontSize(12).font('Helvetica')
       .text(`${interview.domain.toUpperCase()} · ${interview.difficulty} Level`, 50, 65);

    doc.fill('black').moveDown(3);

    // Candidate info
    doc.roundedRect(50, 120, doc.page.width - 100, 60, 6)
       .fillAndStroke('#f8f7ff', PURPLE);
    doc.fill('black').fontSize(11).font('Helvetica-Bold')
       .text(`Candidate: ${interview.userId.name}`, 65, 135);
    doc.font('Helvetica').fill(GRAY)
       .text(`Email: ${interview.userId.email}`, 65, 152)
       .text(`Date: ${new Date(interview.completedAt || interview.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}`, 300, 135);

    // Overall score
    doc.moveDown(4);
    doc.fill(PURPLE).fontSize(16).font('Helvetica-Bold').text('Overall Score', 50);
    const scored = interview.qa.filter(q => q.evaluation?.score != null);
    const avg    = scored.length ? scored.reduce((a, q) => a + q.evaluation.score, 0) / scored.length : 0;
    const grade  = avg >= 8 ? 'A' : avg >= 6 ? 'B' : avg >= 4 ? 'C' : 'D';
    const scoreColor = avg >= 7 ? GREEN : avg >= 5 ? '#d97706' : RED;

    doc.fill(scoreColor).fontSize(40).font('Helvetica-Bold')
       .text(`${Math.round(avg * 10) / 10} / 10  (Grade ${grade})`, 50);

    // Q&A Breakdown
    doc.moveDown(2);
    doc.fill(PURPLE).fontSize(16).font('Helvetica-Bold').text('Question Breakdown');
    doc.moveDown(0.5);

    interview.qa.forEach((qa, i) => {
      if (doc.y > 680) doc.addPage();
      const sc = qa.evaluation?.score;
      const c  = sc != null ? (sc >= 7 ? GREEN : sc >= 5 ? '#d97706' : RED) : GRAY;

      doc.fill(c).fontSize(13).font('Helvetica-Bold')
         .text(`Q${i + 1}  Score: ${sc != null ? sc + '/10' : 'N/A'}`, 50);
      doc.fill('#1a1a1a').fontSize(10).font('Helvetica-Bold')
         .text(qa.question, 50, doc.y + 4, { width: 495 });
      doc.fill(GRAY).font('Helvetica')
         .text(`Answer: ${qa.answer || '(no answer)'}`, 50, doc.y + 4, { width: 495 });

      if (qa.evaluation) {
        doc.fill(GREEN).text(`Strengths: ${qa.evaluation.strengths?.join(' · ')}`, 50, doc.y + 4, { width: 495 });
        doc.fill(RED).text(`Improve: ${qa.evaluation.weaknesses?.join(' · ')}`, 50, doc.y + 4, { width: 495 });
        doc.fill(PURPLE).text(`Better: ${qa.evaluation.improved_answer}`, 50, doc.y + 4, { width: 495 });
      }
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.5);
    });

    // Footer
    doc.fill(GRAY).fontSize(9).font('Helvetica')
       .text(`Generated by AI Interview Bot · ${new Date().toISOString()}`,
         50, doc.page.height - 40, { align: 'center', width: 495 });

    doc.end();
  } catch (err) { next(err); }
});

module.exports = router;
