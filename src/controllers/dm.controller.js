const Conversation   = require('../models/Conversation')
const DirectMessage  = require('../models/DirectMessage')
const User           = require('../models/User')
const { catchAsync } = require('../utils/response')
const { getIO }      = require('../sockets/socket')
const { createNotification } = require('../services/notification.service')

// GET /api/dm — list my conversations
exports.getConversations = catchAsync(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate('participants', 'name avatar role')
    .populate('problem', 'title')
    .sort({ lastMessageAt: -1 })

  // Add unread count per conversation
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unread = await DirectMessage.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user._id },
        read: false,
      })
      return { ...conv.toObject(), unreadCount: unread }
    })
  )

  res.json({ conversations: withUnread })
})

// POST /api/dm/start/:userId — get or create conversation with a user
exports.getOrCreateConversation = catchAsync(async (req, res) => {
  const otherUserId = req.params.userId
  const { problemId } = req.body

  if (String(otherUserId) === String(req.user._id)) {
    return res.status(400).json({ message: 'Cannot start conversation with yourself.' })
  }

  const otherUser = await User.findById(otherUserId)
  if (!otherUser) return res.status(404).json({ message: 'User not found.' })

  // Check if conversation already exists (specific to problem if provided)
  const query = {
    participants: { $all: [req.user._id, otherUserId], $size: 2 },
  }
  if (problemId) query.problem = problemId
  else query.problem = { $exists: false }

  let conversation = await Conversation.findOne(query)
    .populate('participants', 'name avatar role')
    .populate('problem', 'title')

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, otherUserId],
      problem: problemId || undefined,
    })
    conversation = await conversation.populate('participants', 'name avatar role')
    if (problemId) conversation = await conversation.populate('problem', 'title')
  }

  res.json({ conversation })
})

// GET /api/dm/:conversationId/messages
exports.getDirectMessages = catchAsync(async (req, res) => {
  const conversation = await Conversation.findById(req.params.conversationId)
  if (!conversation) return res.status(404).json({ message: 'Conversation not found.' })

  const isParticipant = conversation.participants.some(
    (p) => String(p) === String(req.user._id)
  )
  if (!isParticipant) return res.status(403).json({ message: 'Access denied.' })

  const messages = await DirectMessage.find({ conversation: req.params.conversationId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 })

  // Mark unread messages as read
  await DirectMessage.updateMany(
    { conversation: req.params.conversationId, sender: { $ne: req.user._id }, read: false },
    { read: true }
  )

  res.json({ messages })
})

// POST /api/dm/:conversationId/messages
exports.sendDirectMessage = catchAsync(async (req, res) => {
  const { text } = req.body
  const conversation = await Conversation.findById(req.params.conversationId)
  if (!conversation) return res.status(404).json({ message: 'Conversation not found.' })

  const isParticipant = conversation.participants.some(
    (p) => String(p) === String(req.user._id)
  )
  if (!isParticipant) return res.status(403).json({ message: 'Access denied.' })

  const message = await DirectMessage.create({
    conversation: req.params.conversationId,
    sender: req.user._id,
    text,
  })

  // Update conversation's last message
  conversation.lastMessage = text.length > 80 ? text.slice(0, 80) + '...' : text
  conversation.lastMessageAt = new Date()
  await conversation.save()

  const populated = await message.populate('sender', 'name avatar')

  // Real-time broadcast
  try {
    const io = getIO()
    io.to(`dm_${req.params.conversationId}`).emit('receive_dm', populated)

    // Notify the other participant
    const otherParticipantId = conversation.participants.find(p => String(p) !== String(req.user._id))
    if (otherParticipantId) {
      await createNotification({
        userId: otherParticipantId,
        type: 'new_message',
        title: 'New message',
        message: `You have a new direct message.`,
        link: `/messages/${req.params.conversationId}`,
      }, io)
    }
  } catch (err) {
    console.error('Socket/Notification error in DM controller:', err.message)
  }

  res.status(201).json({ message: populated })
})
