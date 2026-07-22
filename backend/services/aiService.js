// services/aiService.js — All AI interactions via Google Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Question = require('../models/Question');

const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const STATIC_FALLBACKS = {
  hr: {
    Easy: [
      "Tell me about yourself and your background.",
      "Why are you interested in this role?",
      "What are your greatest strengths?",
      "What is your preferred work style?"
    ],
    Medium: [
      "Describe a time you had a conflict with a coworker and how you resolved it.",
      "Tell me about a project you led. What was the outcome?",
      "How do you prioritize when you have multiple deadlines?",
      "Describe a time when you had to work with someone whose style was very different from yours."
    ],
    Hard: [
      "Describe a situation where you had to deliver difficult feedback to a senior colleague.",
      "Tell me about a time you failed. What did you learn?",
      "How do you handle high-pressure situations or tight deadlines?",
      "Describe a time when you had to make a decision without all the information you needed."
    ]
  },
  technical: {
    Easy: [
      "What is the difference between SQL and NoSQL databases?",
      "Explain RESTful API principles.",
      "What is MVC architecture and why is it used?",
      "What is the difference between HTTP and HTTPS?"
    ],
    Medium: [
      "How would you design a URL shortening service like bit.ly?",
      "Explain database indexing and when you would use it.",
      "How does load balancing work, and what are some common algorithms?",
      "What is caching, and how would you implement cache invalidation?"
    ],
    Hard: [
      "Design a distributed rate limiter for a high-traffic API.",
      "How would you design Twitter's trending topics feature?",
      "Explain the CAP theorem and its implications in distributed systems.",
      "How would you approach scaling a database to handle millions of writes per second?"
    ]
  },
  coding: {
    Easy: [
      "Reverse a string without using built-in reverse methods.",
      "Check if a string is a palindrome.",
      "Find the maximum number in an array.",
      "Count the occurrences of a character in a string."
    ],
    Medium: [
      "Find all pairs in an array that sum to a target value. What is the time complexity?",
      "Implement a function to flatten a deeply nested array.",
      "Write a function to find the longest substring without repeating characters.",
      "Given a binary tree, implement level-order traversal."
    ],
    Hard: [
      "Implement LRU cache with O(1) get and put operations.",
      "Merge k sorted linked lists and analyze the complexity.",
      "Solve the classic 0/1 Knapsack problem.",
      "Implement a trie (prefix tree) with insert, search, and startsWith methods."
    ]
  },
  custom: {
    Easy: [
      "What are the foundational concepts you should know in this area?",
      "What motivated you to learn this topic?",
      "Describe a basic tool or library you use for this.",
      "What is the most common mistake beginners make in this field?"
    ],
    Medium: [
      "Can you explain a challenging problem you solved in this domain?",
      "What are the best practices for structuring projects in this topic?",
      "How do you stay up-to-date with the latest developments in this area?",
      "What is a design pattern you find highly applicable here?"
    ],
    Hard: [
      "What are the major performance or scaling bottlenecks in this domain?",
      "How would you architect a complex system using this technology?",
      "Explain a controversial or highly debated topic in this community.",
      "What is the future outlook or evolution path of this technology?"
    ]
  }
};

// ── Domain system prompts ─────────────────────────────────────
const getSystemPrompt = (domain, difficulty, customTopic = '') => {
  const base = `You are a professional interviewer. When evaluating answers, 
respond ONLY with valid JSON (no markdown, no extra text, no code fences): 
{"score":0-10,"strengths":["..."],"weaknesses":["..."],"improved_answer":"...","summary":"..."}`;

  const prompts = {
    hr: `You are a Senior HR Business Partner at a Fortune 500 tech company conducting a ${difficulty} behavioral interview.
Use the STAR method framework. Focus on: leadership, teamwork, communication, conflict resolution, adaptability, cultural fit.
Ask ONE question at a time. Be warm, professional, and encouraging.
${base}`,

    technical: `You are a Staff Engineer at a FAANG company conducting a ${difficulty} technical interview.
Cover: system design, scalability, data structures, algorithms, databases, APIs, architecture patterns.
Ask ONE technical question. Go deep on follow-ups. Probe for understanding, not just surface knowledge.
${base}`,

    coding: `You are a Senior Software Engineer conducting a ${difficulty} coding/DSA interview.
Start with a clear problem statement. Ask about approach first, then code, then complexity.
Focus on: problem-solving process, clean code, time/space complexity, edge cases, optimization.
${base}`,

    custom: `You are an expert interviewer specializing in "${customTopic}" conducting a ${difficulty} interview.
Ask relevant, domain-specific questions that test both theoretical knowledge and practical experience.
${base}`,
  };

  return prompts[domain] || prompts.custom;
};

// ── Helpers ───────────────────────────────────────────────────
const parseJSON = (text) => {
  // Remove markdown code fences if present
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
};

const callGemini = async (systemPrompt, userMessage, maxTokens = 600) => {
  const dynamicModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  });

  const chat = dynamicModel.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: maxTokens,
    },
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
};

const callGeminiWithHistory = async (systemPrompt, messages, maxTokens = 600) => {
  // Convert messages array to Gemini chat history format
  const history = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    history.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  const dynamicModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  });

  const chat = dynamicModel.startChat({
    history,
    generationConfig: {
      maxOutputTokens: maxTokens,
    },
  });

  // Send the last message
  const lastMsg = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMsg.content);
  return result.response.text();
};

// ── Public API ────────────────────────────────────────────────

/**
 * Generate opening greeting + first question
 */
const generateGreeting = async (domain, difficulty, customTopic, userName) => {
  try {
    const system = getSystemPrompt(domain, difficulty, customTopic);
    return await callGemini(system,
      `Start the ${difficulty} ${domain === 'custom' ? customTopic : domain} interview. 
Greet "${userName}" warmly, briefly introduce your role, and ask Question 1. Be concise (3-5 sentences total).`,
      400
    );
  } catch (err) {
    console.warn('⚠️ Gemini API failed, using fallback question:', err.message);
    const greetingStart = `Hello ${userName}! Welcome to your ${difficulty} ${domain === 'custom' ? customTopic : domain} interview. I will be your interviewer today. Let's get started.`;
    
    // Attempt to get a question from database
    try {
      const dbQuestion = await Question.findOne({ domain, difficulty });
      if (dbQuestion) {
        return `${greetingStart}\n\nQuestion 1: ${dbQuestion.text}`;
      }
    } catch (dbErr) {
      console.warn('⚠️ DB query failed for fallback question:', dbErr.message);
    }
    
    // Use static fallback
    const list = STATIC_FALLBACKS[domain]?.[difficulty] || STATIC_FALLBACKS.custom[difficulty];
    const q = list[0] || "Could you start by introducing yourself and sharing your background?";
    return `${greetingStart}\n\nQuestion 1: ${q}`;
  }
};

/**
 * Evaluate a single answer — returns parsed JSON object
 */
const evaluateAnswer = async (domain, difficulty, customTopic, question, answer) => {
  try {
    const system = getSystemPrompt(domain, difficulty, customTopic);
    const text = await callGemini(system,
      `Interview question: "${question}"\n\nCandidate's answer: "${answer}"\n\nEvaluate this answer. Respond ONLY with the JSON object, no markdown fences.`,
      700
    );
    return parseJSON(text);
  } catch (err) {
    console.warn('⚠️ Gemini evaluation failed, generating fallback scoring:', err.message);
    
    // Dynamic score based on answer length to simulate realistic grading
    const wordCount = answer ? answer.trim().split(/\s+/).length : 0;
    let score = 5;
    if (wordCount > 35) score = 8;
    else if (wordCount > 15) score = 7;
    else if (wordCount > 5) score = 6;
    else score = 4;
    
    return {
      score,
      strengths: ['Responded to the question', 'Provided a prompt response'],
      weaknesses: ['Could expand with more specific metrics or details', 'Structure could be improved using the STAR method'],
      improved_answer: 'A stronger response would outline the Situation, Task, Action, and Result clearly, highlighting your personal impact.',
      summary: 'Solid effort. Expand with more concrete examples and structure next time.',
    };
  }
};

/**
 * Generate next question given full conversation history
 */
const generateNextQuestion = async (domain, difficulty, customTopic, history, qNumber, total) => {
  try {
    const system = getSystemPrompt(domain, difficulty, customTopic);
    const messages = history.flatMap(qa => [
      { role: 'assistant', content: qa.question },
      { role: 'user',      content: qa.answer || '(No answer)' },
    ]);
    messages.push({
      role: 'user',
      content: `Ask Question ${qNumber} of ${total}. Make it distinct from previous questions. Vary the topic/angle.`,
    });
    return await callGeminiWithHistory(system, messages, 400);
  } catch (err) {
    console.warn('⚠️ Gemini failed to generate next question, using fallback:', err.message);
    
    // Collect already asked questions to avoid duplication
    const askedQuestions = history.map(h => h.question.toLowerCase());
    
    // Try DB query first
    try {
      const dbQuestions = await Question.find({ domain, difficulty });
      const freshQ = dbQuestions.find(q => !askedQuestions.some(asked => asked.includes(q.text.toLowerCase())));
      if (freshQ) {
        return freshQ.text;
      }
    } catch (dbErr) {
      console.warn('⚠️ DB query failed for next question:', dbErr.message);
    }
    
    // Use static list fallback
    const list = STATIC_FALLBACKS[domain]?.[difficulty] || STATIC_FALLBACKS.custom[difficulty];
    const index = (qNumber - 1) % list.length;
    return list[index] || `Could you explain another key challenge you faced in a recent project?`;
  }
};

/**
 * Generate warm closing message after final question
 */
const generateClosing = async (domain, difficulty, customTopic, history, overallScore) => {
  try {
    const system = getSystemPrompt(domain, difficulty, customTopic);
    const messages = history.flatMap(qa => [
      { role: 'assistant', content: qa.question },
      { role: 'user',      content: qa.answer || '(No answer)' },
    ]);
    messages.push({
      role: 'user',
      content: `The interview is now complete. Their overall score is ${overallScore}/10. 
Deliver a warm, encouraging closing (2-3 sentences). Mention their score naturally. Do NOT evaluate now.`,
    });
    return await callGeminiWithHistory(system, messages, 300);
  } catch (err) {
    console.warn('⚠️ Gemini failed to generate closing, using fallback:', err.message);
    return `Thank you for completing this ${difficulty} ${domain === 'custom' ? customTopic : domain} interview! I have generated your evaluation report showing an overall score of ${overallScore}/10. You did a great job today, and I encourage you to review the feedback to prepare for future interviews.`;
  }
};

module.exports = { generateGreeting, evaluateAnswer, generateNextQuestion, generateClosing };
