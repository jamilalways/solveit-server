const { Server } = require('socket.io')
const jwt        = require('jsonwebtoken')
const Message    = require('../models/Message')
const { createNotification } = require('../services/notification.service')

let io

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  // ── Auth middleware on every socket connection ──────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = String(decoded.id)
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  // ── Connection handler ───────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId
    console.log(`🔌 Socket connected: user ${userId}`)

    // Join a personal room so we can send targeted notifications
    socket.join(`user_${userId}`)

    // ── Join a contract chat room ────────────────────────
    socket.on('join_room', (contractId) => {
      socket.join(`contract_${contractId}`)
      console.log(`   User ${userId} joined room contract_${contractId}`)
    })

    socket.on('leave_room', (contractId) => {
      socket.leave(`contract_${contractId}`)
    })

    // ── Typing indicator ──────────────────────────────────
    socket.on('typing', ({ contractId }) => {
      socket.to(`contract_${contractId}`).emit('user_typing', { userId })
    })

    socket.on('stop_typing', ({ contractId }) => {
      socket.to(`contract_${contractId}`).emit('user_stop_typing', { userId })
    })

    // ── Direct Message (DM) events ───────────────────────
    socket.on('join_dm', (conversationId) => {
      socket.join(`dm_${conversationId}`)
    })

    socket.on('leave_dm', (conversationId) => {
      socket.leave(`dm_${conversationId}`)
    })

    socket.on('dm_typing', ({ conversationId }) => {
      socket.to(`dm_${conversationId}`).emit('dm_user_typing', { userId })
    })

    socket.on('dm_stop_typing', ({ conversationId }) => {
      socket.to(`dm_${conversationId}`).emit('dm_user_stop_typing', { userId })
    })

    // ── Disconnect ────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: user ${userId}`)
    })
  })

  return io
}

// Export io so controllers can emit notifications
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised')
  return io
}

module.exports = { initSocket, getIO }
