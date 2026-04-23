const Notification = require('../models/Notification')

// Create a notification and emit via socket if user is online
const createNotification = async ({ userId, type, title, message, link = '' }, io) => {
  const notif = await Notification.create({ user: userId, type, title, message, link })

  // Emit real-time if socket server passed
  if (io) {
    io.to(`user_${userId}`).emit('notification', notif)
  }

  return notif
}

module.exports = { createNotification }
