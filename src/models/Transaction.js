const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  wallet:      { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet',   required: true },
  contract:    { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', default: null },
  type: {
    type: String,
    enum: [
      'deposit',
      'withdrawal',
      'escrow_lock',
      'escrow_release',
      'payment_received',
      'refund',
    ],
    required: true,
  },
  amount:      { type: Number, required: true },
  description: { type: String, default: '' },
}, { timestamps: true })

transactionSchema.index({ wallet: 1 })

module.exports = mongoose.model('Transaction', transactionSchema)