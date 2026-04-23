const mongoose = require('mongoose')

const disputeSchema = new mongoose.Schema({
  contract:   { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  raisedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  reason:     { type: String, required: true, maxlength: 2000 },
  status:     { type: String, enum: ['open', 'under_review', 'resolved'], default: 'open' },
  resolution: { type: String, enum: ['client_wins', 'solver_wins', 'split'], default: null },
  adminNote:  { type: String, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('Dispute', disputeSchema)
