const User        = require('../models/User')
const Problem     = require('../models/Problem')
const Contract    = require('../models/Contract')
const Transaction = require('../models/Transaction')
const Dispute     = require('../models/Dispute')
const Notification= require('../models/Notification')
const { catchAsync } = require('../utils/response')

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Returns platform-wide analytics summary
// ─────────────────────────────────────────────────────────────────────────────
exports.getStats = catchAsync(async (req, res) => {
  // Run all count queries in parallel for performance
  const [
    totalUsers,
    totalClients,
    totalSolvers,
    totalProblems,
    openProblems,
    activeContracts,
    completedContracts,
    openDisputes,
    revenueAgg,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'client' }),
    User.countDocuments({ role: 'solver' }),
    Problem.countDocuments(),
    Problem.countDocuments({ status: 'open' }),
    Contract.countDocuments({ status: 'active' }),
    Contract.countDocuments({ status: 'completed' }),
    Dispute.countDocuments({ status: { $ne: 'resolved' } }),
    Transaction.aggregate([
      { $match: { type: 'escrow_release' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
  ])

  const totalRevenue = revenueAgg[0]?.total || 0

  res.json({
    stats: {
      totalUsers,
      totalClients,
      totalSolvers,
      totalProblems,
      openProblems,
      activeContracts,
      totalContracts: completedContracts,
      openDisputes,
      totalRevenue,
    },
    recentUsers,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// Returns paginated list of all users with optional role filter
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query

  const filter = {}
  if (role && role !== 'all') filter.role = role
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const total = await User.countDocuments(filter)
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .select('-password')

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
// Returns single user detail with their problems, contracts, wallet
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')
  if (!user) return res.status(404).json({ message: 'User not found.' })

  const [problemCount, contractCount] = await Promise.all([
    Problem.countDocuments({ client: user._id }),
    Contract.countDocuments({ $or: [{ client: user._id }, { solver: user._id }] }),
  ])

  res.json({ user, problemCount, contractCount })
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/ban
// Toggle ban/unban a user (cannot ban another admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleBan = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found.' })
  if (user.role === 'admin') {
    return res.status(400).json({ message: 'Admin accounts cannot be banned.' })
  }

  user.isBanned = !user.isBanned
  await user.save({ validateBeforeSave: false })

  // Notify user about ban status
  if (user.isBanned) {
    await Notification.create({
      user:    user._id,
      type:    'bid_rejected', // reusing closest type
      title:   'Account suspended',
      message: 'Your account has been suspended by an administrator. Please contact support.',
    })
  }

  res.json({
    message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully.`,
    user,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/problems
// Returns all problems on the platform (admin view — all statuses)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProblems = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = {}
  if (status && status !== 'all') filter.status = status

  const total    = await Problem.countDocuments(filter)
  const problems = await Problem.find(filter)
    .populate('client', 'name email avatar')
    .populate('solver', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))

  res.json({ problems, total, page: Number(page), pages: Math.ceil(total / limit) })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/disputes
// Returns all disputes (open + resolved) with full population
// ─────────────────────────────────────────────────────────────────────────────
exports.getDisputes = catchAsync(async (req, res) => {
  const { status } = req.query
  const filter = {}
  if (status && status !== 'all') filter.status = status

  const disputes = await Dispute.find(filter)
    .populate({
      path:     'contract',
      select:   'amount problem client solver',
      populate: [
        { path: 'client', select: 'name email' },
        { path: 'solver', select: 'name email' },
        { path: 'problem', select: 'title' },
      ],
    })
    .populate('raisedBy',   'name email role')
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 })

  res.json({ disputes })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/activity
// Returns recent activity log across the platform
// ─────────────────────────────────────────────────────────────────────────────
exports.getActivityLog = catchAsync(async (req, res) => {
  const [recentUsers, recentProblems, recentContracts, recentDisputes] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt'),
    Problem.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('client', 'name')
      .select('title category budget status createdAt client'),
    Contract.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('client', 'name')
      .populate('solver', 'name')
      .select('amount status createdAt client solver'),
    Dispute.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('raisedBy', 'name role')
      .select('reason status createdAt raisedBy'),
  ])

  // Merge and sort all activity by date
  const activity = [
    ...recentUsers.map(u     => ({ type: 'user_joined',       time: u.createdAt,  text: `${u.name} joined as ${u.role}` })),
    ...recentProblems.map(p  => ({ type: 'problem_posted',    time: p.createdAt,  text: `${p.client?.name} posted "${p.title}"` })),
    ...recentContracts.map(c => ({ type: 'contract_created',  time: c.createdAt,  text: `Contract between ${c.client?.name} and ${c.solver?.name} — ${formatBDT(c.amount)}` })),
    ...recentDisputes.map(d  => ({ type: 'dispute_raised',    time: d.createdAt,  text: `${d.raisedBy?.name} raised a dispute` })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15)

  res.json({ activity })
})

// ─── Helper (internal only) ──────────────────────────────────────────────────
function formatBDT(amount) {
  return `৳ ${Number(amount || 0).toLocaleString('en-IN')}`
}
