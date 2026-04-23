const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role:     { type: String, enum: ['client', 'solver', 'admin'], default: 'client' },
  avatar:   { type: String, default: '' },

  // Solver-specific fields
  bio:      { type: String, default: '', maxlength: 500 },
  skills:   [{ type: String, trim: true }],
  portfolio:[{ title: String, url: String, description: String }],

  // Reputation
  avgRating:    { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  totalJobs:    { type: Number, default: 0 },
  badge:        { type: String, enum: ['Newcomer', 'Rising Star', 'Intermediate', 'Pro', 'Expert'], default: 'Newcomer' },

  // Status
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  lastSeen: { type: Date,    default: Date.now },
  passwordResetToken:   String,
  passwordResetExpires: Date,
}, { timestamps: true })

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Update badge based on stats
userSchema.methods.updateBadge = function () {
  const { totalJobs, avgRating } = this
  if (totalJobs >= 50 && avgRating >= 4.7)      this.badge = 'Expert'
  else if (totalJobs >= 25 && avgRating >= 4.5) this.badge = 'Pro'
  else if (totalJobs >= 10 && avgRating >= 4.2) this.badge = 'Intermediate'
  else if (totalJobs >= 3  && avgRating >= 4.0) this.badge = 'Rising Star'
  else                                           this.badge = 'Newcomer'
}

userSchema.methods.createPasswordResetToken = function() {
  const crypto = require('crypto')
  const resetToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
  return resetToken
}

// Never return password in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
