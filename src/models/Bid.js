const mongoose = require('mongoose')

const bidSchema = new mongoose.Schema({
  problem:       { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  solver:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  proposedPrice: { type: Number, required: true, min: 1 },
  deliveryDays:  { type: Number, required: true, min: 1 },
  message:       { type: String, required: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true })

// One bid per solver per problem
bidSchema.index({ problem: 1, solver: 1 }, { unique: true })
bidSchema.index({ solver: 1 })

module.exports = mongoose.model('Bid', bidSchema)
