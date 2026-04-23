const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance:       { type: Number, default: 0, min: 0 },
  escrowBalance: { type: Number, default: 0, min: 0 },
}, { timestamps: true })

// Helper: safely get or create a wallet for a user
walletSchema.statics.findOrCreate = async function(userId) {
  let wallet = await this.findOne({ user: userId })
  if (!wallet) {
    wallet = await this.create({ user: userId, balance: 0, escrowBalance: 0 })
  }
  return wallet
}

module.exports = mongoose.model('Wallet', walletSchema)
