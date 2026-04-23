const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// Protect route — must be logged in
exports.protect = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (!token) return res.status(401).json({ message: 'Not authenticated. Please log in.' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await User.findById(decoded.id)

    if (!user)          return res.status(401).json({ message: 'User no longer exists.' })
    if (user.isBanned)  return res.status(403).json({ message: 'Your account has been banned.' })

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// Role guard — restrict to specific roles
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. ${roles.join('/')} only.` })
  }
  next()
}
