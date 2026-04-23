const Notification = require('../models/Notification')
const { catchAsync } = require('../utils/response')

// GET /api/notifications
exports.getNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
  const unread = await Notification.countDocuments({ user: req.user._id, read: false })
  res.json({ notifications, unread })
})

// PUT /api/notifications/read
exports.markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
  res.json({ message: 'All notifications marked as read.' })
})
