const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  text:     { type: String, default: '' },
  file:     { name: String, url: String },
  read:     { type: Boolean, default: false },
}, { timestamps: true })

messageSchema.index({ contract: 1, createdAt: 1 })

module.exports = mongoose.model('Message', messageSchema)
