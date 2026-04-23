const User    = require('../models/User')
const Review  = require('../models/Review')
const path    = require('path')
const fs      = require('fs')
const { catchAsync } = require('../utils/response')

// GET /api/users/:id  — public profile
exports.getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found.' })

  const reviews = await Review.find({ reviewee: user._id })
    .populate('reviewer', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(20)

  res.json({ user, reviews })
})

// PUT /api/users/me  — update own profile (supports avatar upload)
exports.updateProfile = catchAsync(async (req, res) => {
  const { name, bio, skills } = req.body
  const update = {}
  if (name)   update.name   = name
  if (bio !== undefined) update.bio = bio
  if (skills) {
    // skills can come as JSON string or array
    update.skills = typeof skills === 'string' ? JSON.parse(skills) : skills
  }

  // Handle avatar upload
  if (req.file) {
    // If the path starts with http (Cloudinary), use it directly. Otherwise, use relative /uploads path
    update.avatar = req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`
  }

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true })
  res.json({ user })
})
