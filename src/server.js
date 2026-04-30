const express    = require('express')
const http       = require('http')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const dotenv     = require('dotenv')

dotenv.config()

const connectDB      = require('./config/db')
const { initSocket } = require('./sockets/socket')
const errorHandler   = require('./middleware/errorHandler')

// Route imports
const authRoutes     = require('./routes/auth.routes')
const userRoutes     = require('./routes/user.routes')
const problemRoutes  = require('./routes/problem.routes')
const bidRoutes      = require('./routes/bid.routes')
const contractRoutes = require('./routes/contract.routes')
const paymentRoutes  = require('./routes/payment.routes')
const walletRoutes   = require('./routes/wallet.routes')
const chatRoutes     = require('./routes/chat.routes')
const reviewRoutes   = require('./routes/review.routes')
const disputeRoutes  = require('./routes/dispute.routes')
const notifRoutes    = require('./routes/notification.routes')
const adminRoutes    = require('./routes/admin.routes')
const dmRoutes       = require('./routes/dm.routes')
const supportRoutes  = require('./routes/support.routes')

const app    = express()
const server = http.createServer(app)

// Connect Database
connectDB()

// Init Socket.io
initSocket(server)

// ── Allowed origins ───────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://solveit-place.vercel.app', // production frontend (hardcoded fallback)
  process.env.CLIENT_URL,             // also from env var
].filter(Boolean)

// ── Middleware ────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Only log in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/problems',      problemRoutes)
app.use('/api/bids',          bidRoutes)
app.use('/api/contracts',     contractRoutes)
app.use('/api/payments',      paymentRoutes)
app.use('/api/wallet',        walletRoutes)
app.use('/api/chat',          chatRoutes)
app.use('/api/reviews',       reviewRoutes)
app.use('/api/disputes',      disputeRoutes)
app.use('/api/notifications', notifRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/dm',            dmRoutes)
app.use('/api/support',       supportRoutes)

// Health check — Render pings this to keep server awake
app.get('/api/health', (req, res) => {
  res.json({
    status:      'OK',
    environment: process.env.NODE_ENV,
    time:        new Date().toISOString(),
  })
})

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'SolveIt API is running 🚀' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
})

// ── Global Error Handler (must be last) ───────────────────
app.use(errorHandler)

const PORT = process.env.PORT || 5000

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SolveIt server running on port ${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 CORS allowed: ${allowedOrigins.join(', ')}`)
})
