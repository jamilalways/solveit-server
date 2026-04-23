/**
 * fixWallets.js
 * Run once to fix all wallets that have null/undefined escrowBalance.
 * 
 * Usage:
 *   cd solveit-server
 *   node fixWallets.js
 */

require('dotenv').config()
const mongoose = require('mongoose')

const WalletSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  balance:       { type: Number, default: 0 },
  escrowBalance: { type: Number, default: 0 },
}, { timestamps: true })

const Wallet = mongoose.model('Wallet', WalletSchema)

async function fixWallets() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Fix all wallets where escrowBalance is null, undefined, or negative
    const result = await Wallet.updateMany(
      {
        $or: [
          { escrowBalance: { $lt: 0 } },
          { escrowBalance: null },
          { escrowBalance: { $exists: false } },
        ]
      },
      { $set: { escrowBalance: 0 } }
    )

    console.log(`✅ Fixed ${result.modifiedCount} wallets (set escrowBalance to 0)`)

    // Also fix negative main balances
    const result2 = await Wallet.updateMany(
      {
        $or: [
          { balance: { $lt: 0 } },
          { balance: null },
          { balance: { $exists: false } },
        ]
      },
      { $set: { balance: 0 } }
    )

    console.log(`✅ Fixed ${result2.modifiedCount} wallets (set balance to 0)`)

    // Show all wallets after fix
    const wallets = await Wallet.find()
    console.log('\n📋 All wallets after fix:')
    wallets.forEach(w => {
      console.log(`  User: ${w.user} | Balance: ৳${w.balance} | Escrow: ৳${w.escrowBalance}`)
    })

    console.log('\n🎉 Done! All wallets are now safe.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

fixWallets()
