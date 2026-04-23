const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    {
    type: String,
    enum: ['new_bid', 'bid_accepted', 'bid_rejected', 'new_message',
           'contract_started', 'solution_submitted', 'contract_completed',
           'payment_received', 'dispute_raised', 'dispute_resolved'],
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    { type: String, default: '' },
  read:    { type: Boolean, default: false },
}, { timestamps: true })

notificationSchema.index({ user: 1, read: 1 })

module.exports = mongoose.model('Notification', notificationSchema)
