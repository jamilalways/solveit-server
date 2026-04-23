const mongoose = require('mongoose')

const contractSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem',  required: true },
  bid:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bid',      required: true },
  client:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  solver:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },

  amount:      { type: Number, required: true },
  deliveryDays:{ type: Number, required: true },
  deadline:    { type: Date },

  status: {
    type: String,
    enum: ['pending_payment', 'active', 'submitted', 'in_review', 'completed', 'disputed', 'cancelled'],
    default: 'pending_payment',
  },

  solutionFiles: [{
    name: String,
    url:  String,
    publicId: String,
  }],
  solutionNote: { type: String, default: '' },

  escrowLocked:   { type: Boolean, default: false },
  escrowReleased: { type: Boolean, default: false },
  completedAt:    { type: Date },
}, { timestamps: true })

contractSchema.index({ client: 1 })
contractSchema.index({ solver: 1 })
contractSchema.index({ problem: 1 })

module.exports = mongoose.model('Contract', contractSchema)
