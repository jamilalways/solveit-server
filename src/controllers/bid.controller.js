const Bid      = require('../models/Bid')
const Problem  = require('../models/Problem')
const Contract = require('../models/Contract')
const { catchAsync } = require('../utils/response')
const { createNotification } = require('../services/notification.service')
const sendMail = require('../config/mail')
const { bidReceivedTemplate, bidAcceptedTemplate } = require('../utils/emailTemplates')

let _io = null
exports.setIO = (io) => { _io = io }

// POST /api/problems/:id/bids
exports.submitBid = catchAsync(async (req, res) => {
  const { proposedPrice, deliveryDays, message } = req.body
  const problem = await Problem.findById(req.params.id).populate('client', 'name email')

  if (!problem)                return res.status(404).json({ message: 'Problem not found.' })
  if (problem.status !== 'open') return res.status(400).json({ message: 'This problem is no longer accepting bids.' })
  if (String(problem.client._id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot bid on your own problem.' })
  }

  const existing = await Bid.findOne({ problem: problem._id, solver: req.user._id })
  if (existing) return res.status(400).json({ message: 'You have already submitted a bid on this problem.' })

  const bid = await Bid.create({
    problem: problem._id, solver: req.user._id,
    proposedPrice, deliveryDays, message,
  })

  // Increment bid count on problem
  problem.bidsCount += 1
  await problem.save({ validateBeforeSave: false })

  // Notify client
  await createNotification({
    userId:  problem.client._id,
    type:    'new_bid',
    title:   'New proposal received',
    message: `${req.user.name} submitted a proposal on "${problem.title}"`,
    link:    `/problems/${problem._id}`,
  }, _io)

  // Email client
  sendMail({
    to:      problem.client.email,
    subject: 'New bid on your problem',
    html:    bidReceivedTemplate(problem.client.name, problem.title, req.user.name),
  })

  const populated = await bid.populate('solver', 'name avatar avgRating badge')
  res.status(201).json({ bid: populated })
})

// GET /api/problems/:id/bids
exports.getBids = catchAsync(async (req, res) => {
  const bids = await Bid.find({ problem: req.params.id })
    .populate('solver', 'name avatar avgRating totalJobs badge')
    .sort({ createdAt: -1 })
  res.json({ bids })
})

// GET /api/bids/mine — For solver dashboard
exports.getMyBids = catchAsync(async (req, res) => {
  const bids = await Bid.find({ solver: req.user._id })
    .populate('problem', 'title status client budget')
    .sort({ createdAt: -1 })
  res.json({ bids })
})

// GET /api/bids/incoming — For client dashboard
exports.getIncomingBids = catchAsync(async (req, res) => {
  const problems = await Problem.find({ client: req.user._id }).select('_id')
  const problemIds = problems.map((p) => p._id)

  const bids = await Bid.find({ problem: { $in: problemIds }, status: 'pending' })
    .populate('solver', 'name avatar avgRating badge')
    .populate('problem', 'title budget')
    .sort({ createdAt: -1 })
    .limit(10)

  res.json({ bids })
})

// PUT /api/bids/:id/accept
exports.acceptBid = catchAsync(async (req, res) => {
  const bid = await Bid.findById(req.params.id).populate('solver', 'name email')
  if (!bid) return res.status(404).json({ message: 'Bid not found.' })

  const problem = await Problem.findById(bid.problem)
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })
  if (String(problem.client) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the problem owner can accept bids.' })
  }
  if (problem.status !== 'open') {
    return res.status(400).json({ message: 'A bid has already been accepted for this problem.' })
  }

  // Ensure client has enough balance before accepting
  const Wallet = require('../models/Wallet')
  const wallet = await Wallet.findOne({ user: req.user._id })
  if (!wallet || wallet.balance < bid.proposedPrice) {
    return res.status(400).json({ message: `Insufficient wallet balance. Please deposit at least ৳${bid.proposedPrice.toLocaleString()} to accept this bid.` })
  }

  // Accept this bid, reject all others
  bid.status = 'accepted'
  await bid.save()
  await Bid.updateMany(
    { problem: bid.problem, _id: { $ne: bid._id } },
    { status: 'rejected' }
  )

  // Create contract
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + bid.deliveryDays)

  let contract = await Contract.create({
    problem:      problem._id,
    bid:          bid._id,
    client:       req.user._id,
    solver:       bid.solver._id,
    amount:       bid.proposedPrice,
    deliveryDays: bid.deliveryDays,
    deadline,
    status:       'pending_payment',
  })

  // Automatically lock escrow since we verified balance
  const { lockEscrow } = require('../services/escrow.service')
  contract = await lockEscrow(contract._id, req.user._id)

  // Update problem status
  problem.status = 'active'
  problem.solver = bid.solver._id
  await problem.save()

  // Notify solver
  await createNotification({
    userId:  bid.solver._id,
    type:    'bid_accepted',
    title:   'Your bid was accepted!',
    message: `Your proposal on "${problem.title}" has been accepted and escrow is locked.`,
    link:    `/dashboard/solver`,
  }, _io)

  sendMail({
    to:      bid.solver.email,
    subject: 'Your bid was accepted!',
    html:    bidAcceptedTemplate(bid.solver.name, problem.title),
  })

  res.json({ bid, contract })
})

// PUT /api/bids/:id/reject
exports.rejectBid = catchAsync(async (req, res) => {
  const bid = await Bid.findById(req.params.id)
  if (!bid) return res.status(404).json({ message: 'Bid not found.' })

  const problem = await Problem.findById(bid.problem)
  if (String(problem.client) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not authorised.' })
  }

  bid.status = 'rejected'
  await bid.save()

  await createNotification({
    userId:  bid.solver,
    type:    'bid_rejected',
    title:   'Proposal not selected',
    message: `Your proposal on "${problem.title}" was not selected this time.`,
    link:    `/problems`,
  }, _io)

  res.json({ bid })
})
