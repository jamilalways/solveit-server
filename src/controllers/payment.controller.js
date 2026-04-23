const Wallet      = require('../models/Wallet')
const Transaction = require('../models/Transaction')
const { lockEscrow } = require('../services/escrow.service')
const { catchAsync } = require('../utils/response')

// GET /api/wallet
exports.getWallet = catchAsync(async (req, res) => {
  let wallet = await Wallet.findOne({ user: req.user._id })
  if (!wallet) wallet = await Wallet.create({ user: req.user._id })

  const transactions = await Transaction.find({ wallet: wallet._id })
    .sort({ createdAt: -1 })
    .limit(20)

  res.json({ wallet, transactions })
})

// POST /api/wallet/deposit
exports.deposit = catchAsync(async (req, res) => {
  const { amount } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount.' })

  let wallet = await Wallet.findOne({ user: req.user._id })
  if (!wallet) wallet = await Wallet.create({ user: req.user._id })

  wallet.balance += Number(amount)
  await wallet.save()

  await Transaction.create({
    wallet:      wallet._id,
    type:        'deposit',
    amount:      Number(amount),
    description: `Wallet top-up of ৳${Number(amount).toLocaleString()}`,
  })

  res.json({ wallet, message: `৳${Number(amount).toLocaleString()} deposited successfully.` })
})

// POST /api/wallet/withdraw
exports.withdraw = catchAsync(async (req, res) => {
  const { amount } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount.' })

  const wallet = await Wallet.findOne({ user: req.user._id })
  if (!wallet || wallet.balance < amount) {
    return res.status(400).json({ message: 'Insufficient balance.' })
  }

  wallet.balance -= Number(amount)
  await wallet.save()

  await Transaction.create({
    wallet:      wallet._id,
    type:        'withdrawal',
    amount:      Number(amount),
    description: `Withdrawal of ৳${Number(amount).toLocaleString()}`,
  })

  res.json({ wallet, message: `৳${Number(amount).toLocaleString()} withdrawn successfully.` })
})

// POST /api/payments/escrow/:contractId
exports.lockEscrowRoute = catchAsync(async (req, res) => {
  const contract = await lockEscrow(req.params.contractId, req.user._id)
  res.json({ contract, message: 'Funds locked in escrow. The solver can now begin work.' })
})
