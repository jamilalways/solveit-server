exports.sendSuccess = (res, statusCode, data) => {
  res.status(statusCode).json({ success: true, ...data })
}

exports.sendError = (res, statusCode, message) => {
  res.status(statusCode).json({ success: false, message })
}

// Wrap async route handlers to avoid try/catch in every controller
exports.catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
