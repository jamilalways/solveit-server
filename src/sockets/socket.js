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

    // ── Send a chat message ───────────────────────────────
    socket.on('send_message', async ({ contractId, message: text }) => {
      if (!contractId || !text?.trim()) return

      try {
        // Persist to DB
        const Contract = require('../models/Contract')
        const contract = await Contract.findById(contractId)
        if (!contract) return

        const isParty =
          String(contract.client) === userId ||
          String(contract.solver) === userId
        if (!isParty) return

        const msg = await Message.create({
          contract: contractId,
          sender:   userId,
          text:     text.trim(),
        })
        const populated = await msg.populate('sender', 'name avatar')

        // Broadcast to the room (both users)
        io.to(`contract_${contractId}`).emit('receive_message', populated)

        // Notify the other party
        const recipientId =
          String(contract.client) === userId
            ? contract.solver
            : contract.client

        await createNotification({
          userId:  recipientId,
          type:    'new_message',
          title:   'New message',
          message: `You have a new message in your contract chat.`,
          link:    `/chat/${contractId}`,
        }, io)

      } catch (err) {
        console.error('Socket send_message error:', err.message)
        socket.emit('error', { message: 'Failed to send message.' })
      }
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

    socket.on('send_dm', async ({ conversationId, text }) => {
      if (!conversationId || !text?.trim()) return

      try {
        const Conversation   = require('../models/Conversation')
        const DirectMessage  = require('../models/DirectMessage')

        const conversation = await Conversation.findById(conversationId)
        if (!conversation) return

        const isParticipant = conversation.participants.some(
          (p) => String(p) === userId
        )
        if (!isParticipant) return

        const msg = await DirectMessage.create({
          conversation: conversationId,
          sender: userId,
          text: text.trim(),
        })
        const populated = await msg.populate('sender', 'name avatar')

        // Update conversation last message
        conversation.lastMessage = text.length > 80 ? text.slice(0, 80) + '...' : text
        conversation.lastMessageAt = new Date()
        await conversation.save()

        // Broadcast to both participants in the DM room
        io.to(`dm_${conversationId}`).emit('receive_dm', populated)

        // Notify the other participant
        const recipientId = conversation.participants.find(
          (p) => String(p) !== userId
        )

        if (recipientId) {
          await createNotification({
            userId: recipientId,
            type: 'new_message',
            title: 'New message',
            message: `You have a new direct message.`,
            link: `/messages/${conversationId}`,
          }, io)
        }
      } catch (err) {
        console.error('Socket send_dm error:', err.message)
        socket.emit('error', { message: 'Failed to send message.' })
      }
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
