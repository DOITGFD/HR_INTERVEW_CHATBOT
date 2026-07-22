// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'],
    trim: true, maxlength: [100, 'Name too long'],
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String, required: [true, 'Password required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // never returned in queries by default
  },
  role:     { type: String, enum: ['student', 'admin'], default: 'student' },
  avatar:   { type: String, default: '' },
  lastLogin:{ type: Date },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: compare passwords
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
