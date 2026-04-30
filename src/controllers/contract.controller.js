const Contract = require('../models/Contract')
const User     = require('../models/User')
const { catchAsync } = require('../utils/response')
const { releaseEscrow } = require('../services/escrow.service')
const { recalcBadge }   = require('../services/badge.service')
const { createNotification } = require('../services/notification.service')
const sendMail = require('../config/mail')
const { contractCompletedTemplate } = require('../utils/emailTemplates')

let _io = null
exports.setIO = (io) => { _io = io }

// GET /api/contracts
exports.getContracts = catchAsync(async (req, res) => {
  const userId = req.user._id
  const role   = req.user.role
  const filter = role === 'client' ? { client: userId } : { solver: userId }

  const contracts = await Contract.find(filter)
    .populate('problem', 'title category')
    .populate('client',  'name avatar')
    .populate('solver',  'name avatar')
    .sort({ createdAt: -1 })

  res.json({ contracts })
})

// GET /api/contracts/:id
exports.getContract = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id)
    .populate('problem', 'title description category budget')
    .populate('client',  'name avatar email')
    .populate('solver',  'name avatar email')
    .populate('bid',     'proposedPrice deliveryDays message')

  if (!contract) return res.status(404).json({ message: 'Contract not found.' })

  const isParty =
    String(contract.client._id) === String(req.user._id) ||
    String(contract.solver._id) === String(req.user._id) ||
    req.user.role === 'admin'
  if (!isParty) return res.status(403).json({ message: 'Access denied.' })

  res.json({ contract })
})

// GET /api/contracts/problem/:problemId
exports.getContractByProblem = catchAsync(async (req, res) => {
  const { problemId } = req.params
  const userId = req.user._id

  const contract = await Contract.findOne({
    problem: problemId,
    $or: [
      { client: userId },
      { solver: userId }
    ]
  })
    .populate('problem', 'title budget')
    .populate('client',  'name avatar')
    .populate('solver',  'name avatar')

  if (!contract) return res.status(404).json({ message: 'Contract not found for this problem.' })

  res.json({ contract })
})

// POST /api/contracts/:id/submit — solver submits solution
exports.submitSolution = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id)
  if (!contract) return res.status(404).json({ message: 'Contract not found.' })
  if (String(contract.solver) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the assigned solver can submit a solution.' })
  }
  if (contract.status !== 'active') {
    return res.status(400).json({ message: 'Contract is not active.' })
  }

  const files = (req.files || []).map((f) => ({
    name: f.originalname, url: f.path, publicId: f.filename,
  }))

  contract.solutionFiles = files
  contract.solutionNote  = req.body.note || ''
  contract.status        = 'submitted'
  await contract.save()

  await createNotification({
    userId:  contract.client,
    type:    'solution_submitted',
    title:   'Solution submitted for review',
    message: 'The solver has submitted their solution. Please review and mark as complete.',
    link:    `/contracts/${contract._id}`,
  }, _io)

  res.json({ contract })
})

// PUT /api/contracts/:id/complete — client releases payment
exports.completeContract = catchAsync(async (req, res) => {
  const contractCheck = await Contract.findById(req.params.id)
  if (!contractCheck) return res.status(404).json({ message: 'Contract not found.' })
  if (contractCheck.status !== 'submitted') {
    return res.status(400).json({ message: 'Solver must submit work before you can release payment.' })
  }

  const contract = await releaseEscrow(req.params.id, req.user._id)

  // Update solver stats
  await User.findByIdAndUpdate(contract.solver, { $inc: { totalJobs: 1 } })
  await recalcBadge(contract.solver)

  const solver = await User.findById(contract.solver)
  const problem = await require('../models/Problem').findById(contract.problem)

  await createNotification({
    userId:  contract.solver,
    type:    'payment_received',
    title:   'Payment received!',
    message: `৳ ${contract.amount.toLocaleString()} has been added to your wallet.`,
    link:    `/dashboard/solver`,
  }, _io)

  sendMail({
    to:      solver.email,
    subject: 'Payment released to your wallet',
    html:    contractCompletedTemplate(solver.name, contract.amount, problem?.title || 'your project'),
  })

  res.json({ contract })
})
