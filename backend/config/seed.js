// config/seed.js — Seed database with sample data
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User     = require('../models/User');
const Question = require('../models/Question');

const SAMPLE_QUESTIONS = [
  // HR - Easy
  { text: 'Tell me about yourself and your background.', domain:'hr', difficulty:'Easy', tags:['intro','background'] },
  { text: 'Why are you interested in this role?', domain:'hr', difficulty:'Easy', tags:['motivation'] },
  { text: 'What are your greatest strengths?', domain:'hr', difficulty:'Easy', tags:['strengths'] },
  // HR - Medium
  { text: 'Describe a time you had a conflict with a coworker and how you resolved it.', domain:'hr', difficulty:'Medium', tags:['conflict','STAR'] },
  { text: 'Tell me about a project you led. What was the outcome?', domain:'hr', difficulty:'Medium', tags:['leadership','STAR'] },
  { text: 'How do you prioritize when you have multiple deadlines?', domain:'hr', difficulty:'Medium', tags:['time-management'] },
  // HR - Hard
  { text: 'Describe a situation where you had to deliver difficult feedback to a senior colleague.', domain:'hr', difficulty:'Hard', tags:['leadership','feedback'] },
  { text: 'Tell me about a time you failed. What did you learn?', domain:'hr', difficulty:'Hard', tags:['failure','growth'] },
  // Technical - Easy
  { text: 'What is the difference between SQL and NoSQL databases?', domain:'technical', difficulty:'Easy', tags:['databases'] },
  { text: 'Explain RESTful API principles.', domain:'technical', difficulty:'Easy', tags:['api','rest'] },
  // Technical - Medium
  { text: 'How would you design a URL shortening service like bit.ly?', domain:'technical', difficulty:'Medium', tags:['system-design'] },
  { text: 'Explain database indexing and when you would use it.', domain:'technical', difficulty:'Medium', tags:['databases','performance'] },
  // Technical - Hard
  { text: 'Design a distributed rate limiter for a high-traffic API.', domain:'technical', difficulty:'Hard', tags:['system-design','distributed'] },
  { text: 'How would you design Twitter\'s trending topics feature?', domain:'technical', difficulty:'Hard', tags:['system-design'] },
  // Coding - Easy
  { text: 'Reverse a string without using built-in reverse methods.', domain:'coding', difficulty:'Easy', tags:['strings','basics'] },
  { text: 'Check if a string is a palindrome.', domain:'coding', difficulty:'Easy', tags:['strings'] },
  // Coding - Medium
  { text: 'Find all pairs in an array that sum to a target value. What is the time complexity?', domain:'coding', difficulty:'Medium', tags:['arrays','hash-map'] },
  { text: 'Implement a function to flatten a deeply nested array.', domain:'coding', difficulty:'Medium', tags:['recursion','arrays'] },
  // Coding - Hard
  { text: 'Implement LRU cache with O(1) get and put operations.', domain:'coding', difficulty:'Hard', tags:['design','hash-map','linked-list'] },
];

async function seedDirect() {
  // Create admin user
  const existing = await User.findOne({ email: 'admin@interviewbot.ai' });
  if (!existing) {
    await User.create({
      name: 'Admin User',
      email: 'admin@interviewbot.ai',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log('✅ Admin user created: admin@interviewbot.ai / Admin@123');
  }

  // Seed questions
  await Question.deleteMany({});
  await Question.insertMany(SAMPLE_QUESTIONS);
  console.log(`✅ ${SAMPLE_QUESTIONS.length} questions seeded`);
}

async function seed() {
  let uri = process.env.MONGO_URI;
  
  // Support in-memory MongoDB for development
  if (uri === 'memory') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('🧪 Using in-memory MongoDB for seeding');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await seedDirect();

  await mongoose.disconnect();
  console.log('Done!');
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = { seedDirect, SAMPLE_QUESTIONS };
