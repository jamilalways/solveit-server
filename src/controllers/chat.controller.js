const Message  = require('../models/Message')
const Contract = require('../models/Contract')
const { catchAsync } = require('../utils/response')
const { getIO }      = require('../sockets/socket')
const { createNotification } = require('../services/notification.service')

// GET /api/chat/:contractId
exports.getMessages = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.contractId)
  if (!contract) return res.status(404).json({ message: 'Contract not found.' })

  const isParty =
    String(contract.client) === String(req.user._id) ||
    String(contract.solver) === String(req.user._id)
  if (!isParty) return res.status(403).json({ message: 'Access denied.' })

  const messages = await Message.find({ contract: req.params.contractId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 })

  // Mark all unread messages as read
  await Message.updateMany(
    { contract: req.params.contractId, sender: { $ne: req.user._id }, read: false },
    { read: true }
  )

  res.json({ messages })
})

// POST /api/chat/:contractId
exports.sendMessage = catchAsync(async (req, res) => {
  const { text } = req.body
  const contract = await Contract.findById(req.params.contractId)
  if (!contract) return res.status(404).json({ message: 'Contract not found.' })

  const isParty =
    String(contract.client) === String(req.user._id) ||
    String(contract.solver) === String(req.user._id)
  if (!isParty) return res.status(403).json({ message: 'Access denied.' })

  const message = await Message.create({
    contract: req.params.contractId,
    sender:   req.user._id,
    text,
  })

  const populated = await message.populate('sender', 'name avatar')

  // Real-time broadcast
  try {
    const io = getIO()
    io.to(`contract_${req.params.contractId}`).emit('receive_message', populated)

    // Notify the other party
    const recipientId = String(contract.client) === String(req.user._id) ? contract.solver : contract.client
    await createNotification({
      userId:  recipientId,
      type:    'new_message',
      title:   'New message',
      message: `You have a new message in your contract chat.`,
      link:    `/chat/${req.params.contractId}`,
    }, io)
  } catch (err) {
    console.error('Socket/Notification error in chat controller:', err.message)
  }

  res.status(201).json({ message: populated })
})
