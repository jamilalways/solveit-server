const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message    = err.message    || 'Internal server error'

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
    statusCode = 400
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map((e) => e.message).join('. ')
    statusCode = 400
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    message    = `Invalid ${err.path}: ${err.value}`
    statusCode = 400
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', err)
  }

  res.status(statusCode).json({ message })
}

module.exports = errorHandler
