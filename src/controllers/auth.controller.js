const User      = require('../models/User')
const Wallet    = require('../models/Wallet')
const { signToken }  = require('../utils/jwt')
const { catchAsync } = require('../utils/response')
const sendMail       = require('../config/mail')
const { welcomeTemplate, resetPasswordTemplate } = require('../utils/emailTemplates')
const crypto    = require('crypto')

// POST /api/auth/register
exports.register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body

  const existing = await User.findOne({ email })
  if (existing) return res.status(400).json({ message: 'Email already registered.' })

  const allowedRoles = ['client', 'solver']
  const userRole = allowedRoles.includes(role) ? role : 'client'

  const user = await User.create({ name, email, password, role: userRole })

  // Create wallet for new user
  await Wallet.create({ user: user._id })

  // Send welcome email (non-blocking)
  sendMail({ to: email, subject: 'Welcome to SolveIt!', html: welcomeTemplate(name, userRole) })

  const token = signToken(user._id)
  res.status(201).json({ message: 'Account created successfully.', token, user })
})

// POST /api/auth/login
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }
  if (user.isBanned) {
    return res.status(403).json({ message: 'Your account has been banned.' })
  }

  user.lastSeen = new Date()
  await user.save({ validateBeforeSave: false })

  const token = signToken(user._id)
  res.json({ message: 'Logged in successfully.', token, user })
})

// GET /api/auth/me
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ user })
})

// POST /api/auth/logout
exports.logout = catchAsync(async (req, res) => {
  res.json({ message: 'Logged out successfully.' })
})

// POST /api/auth/forgot-password
exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'No user found with that email.' })

  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
  
  try {
    sendMail({ 
      to: email, 
      subject: 'Password Reset Request', 
      html: resetPasswordTemplate(user.name, resetUrl) 
    })
    res.json({ message: 'Reset link sent to email.' })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    return res.status(500).json({ message: 'Error sending email. Try again later.' })
  }
})

// POST /api/auth/reset-password/:token
exports.resetPassword = catchAsync(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })

  if (!user) return res.status(400).json({ message: 'Token is invalid or has expired.' })

  user.password = req.body.password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  const token = signToken(user._id)
  res.json({ message: 'Password reset successful.', token, user })
})
