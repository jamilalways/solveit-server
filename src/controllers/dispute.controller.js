const Dispute  = require('../models/Dispute')
const Contract = require('../models/Contract')
const { catchAsync } = require('../utils/response')
const { refundEscrow, releaseEscrow } = require('../services/escrow.service')
const { createNotification }          = require('../services/notification.service')

let _io = null
exports.setIO = (io) => { _io = io }

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/disputes
// Client or solver raises a dispute on an active contract
// ─────────────────────────────────────────────────────────────────────────────
exports.createDispute = catchAsync(async (req, res) => {
  const { contractId, reason } = req.body

  // Verify contract exists
  const contract = await Contract.findById(contractId)
  if (!contract) return res.status(404).json({ message: 'Contract not found.' })

  // Only the client or solver of this contract can raise a dispute
  const isParty =
    String(contract.client) === String(req.user._id) ||
    String(contract.solver) === String(req.user._id)
  if (!isParty) return res.status(403).json({ message: 'You are not a party to this contract.' })

  // Prevent duplicate open disputes
  const existingDispute = await Dispute.findOne({
    contract: contractId,
    status:   { $ne: 'resolved' },
  })
  if (existingDispute) {
    return res.status(400).json({ message: 'An open dispute already exists for this contract.' })
  }

  // Create the dispute
  const dispute = await Dispute.create({
    contract:  contractId,
    raisedBy:  req.user._id,
    reason,
  })

  // Mark contract as disputed
  contract.status = 'disputed'
  await contract.save()

  // Notify the other party
  const recipientId =
    String(contract.client) === String(req.user._id)
      ? contract.solver
      : contract.client

  await createNotification({
    userId:  recipientId,
    type:    'dispute_raised',
    title:   'Dispute raised on your contract',
    message: `${req.user.name} has raised a dispute. An admin will review and resolve it shortly.`,
    link:    `/contracts/${contractId}`,
  }, _io)

  res.status(201).json({ dispute })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/disputes
// Admin: list all disputes (with optional ?status= filter)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllDisputes = catchAsync(async (req, res) => {
  const { status } = req.query
  const filter = {}
  if (status && status !== 'all') filter.status = status

  const disputes = await Dispute.find(filter)
    .populate({
      path:     'contract',
      select:   'amount problem client solver',
      populate: [
        { path: 'client',  select: 'name email' },
        { path: 'solver',  select: 'name email' },
        { path: 'problem', select: 'title' },
      ],
    })
    .populate('raisedBy',   'name email role')
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 })

  res.json({ disputes })
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/disputes/:id/resolve
// Admin: resolve a dispute — either refund client or release to solver
// ─────────────────────────────────────────────────────────────────────────────
exports.resolveDispute = catchAsync(async (req, res) => {
  const { resolution, adminNote } = req.body

  const dispute = await Dispute.findById(req.params.id)
    .populate('contract')
    .populate('raisedBy', 'name')

  if (!dispute)                   return res.status(404).json({ message: 'Dispute not found.' })
  if (dispute.status === 'resolved') return res.status(400).json({ message: 'Dispute is already resolved.' })

  let contract

  if (resolution === 'client_wins') {
    // Refund escrow back to client
    contract = await refundEscrow(String(dispute.contract._id || dispute.contract))
  } else if (resolution === 'solver_wins') {
    // Release escrow to solver
    const contractDoc = await Contract.findById(dispute.contract._id || dispute.contract)
    contract = await releaseEscrow(
      String(contractDoc._id),
      String(contractDoc.client)
    )
  }

  // Mark dispute as resolved
  dispute.status     = 'resolved'
  dispute.resolution = resolution
  dispute.adminNote  = adminNote || ''
  dispute.resolvedBy = req.user._id
  dispute.resolvedAt = new Date()
  await dispute.save()

  // Notify both parties
  const contractDoc = contract || dispute.contract

  const clientId = contractDoc?.client?._id || contractDoc?.client
  const solverId = contractDoc?.solver?._id || contractDoc?.solver

  const outcomeText = resolution === 'client_wins'
    ? 'The escrow has been refunded to the client.'
    : 'The payment has been released to the solver.'

  if (clientId) {
    await createNotification({
      userId:  clientId,
      type:    'dispute_resolved',
      title:   'Dispute resolved',
      message: `Your dispute has been resolved by an admin. ${outcomeText}`,
      link:    `/dashboard/client`,
    }, _io)
  }

  if (solverId) {
    await createNotification({
      userId:  solverId,
      type:    'dispute_resolved',
      title:   'Dispute resolved',
      message: `A dispute on your contract has been resolved by an admin. ${outcomeText}`,
      link:    `/dashboard/solver`,
    }, _io)
  }

  res.json({
    message:  `Dispute resolved. ${outcomeText}`,
    dispute,
  })
})
