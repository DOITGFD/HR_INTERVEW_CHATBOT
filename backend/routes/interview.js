// routes/interview.js
const router    = require('express').Router();
const { protect } = require('../middleware/auth');
const Interview = require('../models/Interview');
const ai        = require('../services/aiService');

const QUESTION_COUNTS = { Easy: 4, Medium: 5, Hard: 6 };

// ── POST /api/interview/start ─────────────────────────────────
router.post('/start', protect, async (req, res, next) => {
  try {
    const { domain, difficulty, customTopic } = req.body;
    if (!domain || !difficulty)
      return res.status(400).json({ error: 'domain and difficulty are required' });

    const totalQuestions = QUESTION_COUNTS[difficulty] || 5;
    const greeting = await ai.generateGreeting(domain, difficulty, customTopic, req.user.name);

    const interview = await Interview.create({
      userId: req.user._id,
      domain,
      difficulty,
      customTopic: customTopic || '',
      totalQuestions,
      status: 'in_progress',
      qa: [{ question: greeting }],
    });

    res.status(201).json({
      interviewId: interview._id,
      totalQuestions,
      message: greeting,
    });
  } catch (err) { next(err); }
});

// ── POST /api/interview/:id/answer ────────────────────────────
router.post('/:id/answer', protect, async (req, res, next) => {
  try {
    const { answer, questionIndex, timeSpent } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });

    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.status !== 'in_progress')
      return res.status(400).json({ error: 'Interview already ended' });

    const currentQ = interview.qa[questionIndex];
    if (!currentQ) return res.status(400).json({ error: 'Invalid question index' });

    // Persist the answer
    currentQ.answer     = answer || '';
    currentQ.timeSpent  = timeSpent || 0;
    currentQ.answeredAt = new Date();

    // AI evaluation
    const evaluation = await ai.evaluateAnswer(
      interview.domain, interview.difficulty, interview.customTopic,
      currentQ.question, answer
    );
    currentQ.evaluation = evaluation;

    const isLastQuestion = questionIndex + 1 >= interview.totalQuestions;
    let nextQuestion = null;
    let closing      = null;

    if (isLastQuestion) {
      // Compute score now (pre-save hook needs updated qa)
      interview.status    = 'completed';
      interview.duration  = interview.qa.reduce((a, q) => a + (q.timeSpent || 0), 0);
      await interview.save(); // triggers overallScore computation

      closing = await ai.generateClosing(
        interview.domain, interview.difficulty, interview.customTopic,
        interview.qa.map(q => ({ question: q.question, answer: q.answer })),
        interview.overallScore
      );
    } else {
      nextQuestion = await ai.generateNextQuestion(
        interview.domain, interview.difficulty, interview.customTopic,
        interview.qa.filter(q => q.answer).map(q => ({ question: q.question, answer: q.answer })),
        questionIndex + 2,
        interview.totalQuestions
      );
      interview.qa.push({ question: nextQuestion });
      await interview.save();
    }

    res.json({
      evaluation,
      nextQuestion,
      closing,
      isComplete:   isLastQuestion,
      overallScore: isLastQuestion ? interview.overallScore : null,
      interviewId:  interview._id,
    });
  } catch (err) { next(err); }
});

// ── POST /api/interview/:id/abandon ──────────────────────────
router.post('/:id/abandon', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'in_progress' },
      { status: 'abandoned' },
      { new: true }
    );
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json({ message: 'Interview abandoned', interview });
  } catch (err) { next(err); }
});

// ── POST /api/interview/execute-code ──────────────────────────
router.post('/execute-code', protect, async (req, res, next) => {
  try {
    const { language, code } = req.body;
    if (!language || !code) return res.status(400).json({ error: 'language and code are required' });

    if (!process.env.JDOODLE_CLIENT_ID || !process.env.JDOODLE_CLIENT_SECRET) {
      return res.status(400).json({ 
        error: 'Code execution requires JDoodle API keys. Please add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your .env file in Render.' 
      });
    }

    // Map common languages to JDoodle identifiers
    const langMap = {
      javascript: { language: 'nodejs', versionIndex: '4' },
      python:     { language: 'python3', versionIndex: '4' },
      java:       { language: 'java', versionIndex: '4' },
      cpp:        { language: 'cpp17', versionIndex: '0' },
    };

    const targetLang = langMap[language];
    if (!targetLang) return res.status(400).json({ error: 'Unsupported language' });

    // Use native Node fetch (available in Node 18+)
    const response = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: code,
        language: targetLang.language,
        versionIndex: targetLang.versionIndex
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    res.json({
      stdout: data.output || '',
      stderr: '', // JDoodle puts compilation errors in 'output' as well
      code: data.statusCode || 0
    });
  } catch (err) { 
    console.error('JDoodle Execution Error:', err);
    res.status(500).json({ error: 'Failed to execute code. Internal Server Error.' }); 
  }
});

// ── GET /api/interview — list user's interviews ───────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, domain, limit = 20, page = 1 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (domain) filter.domain = domain;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('domain customTopic difficulty status overallScore totalQuestions duration createdAt completedAt');

    const total = await Interview.countDocuments(filter);
    res.json({ interviews, total, page: Number(page) });
  } catch (err) { next(err); }
});

// ── GET /api/interview/:id ────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json(interview);
  } catch (err) { next(err); }
});

// ── DELETE /api/interview/:id ─────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const result = await Interview.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Interview deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
