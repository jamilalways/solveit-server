const rateLimit = require('express-rate-limit')

// General API limiter
exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { message: 'Too many requests. Please slow down.' },
})
