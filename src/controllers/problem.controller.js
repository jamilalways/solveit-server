const Problem = require('../models/Problem')
const { catchAsync } = require('../utils/response')

// GET /api/problems
exports.getProblems = catchAsync(async (req, res) => {
  const { search, category, budget, sort, page = 1, limit = 12 } = req.query

  const filter = { status: 'open' }

  if (category) filter.category = category

  if (budget) {
    const [min, max] = budget.split('-')
    if (max === '+' || !max) filter.budget = { $gte: Number(min) }
    else                     filter.budget = { $gte: Number(min), $lte: Number(max) }
  }

  if (search) {
    filter.$text = { $search: search }
  }

  const sortMap = {
    newest:      { createdAt: -1 },
    budget_desc: { budget: -1 },
    deadline_asc:{ deadline: 1 },
    bids_desc:   { bidsCount: -1 },
  }
  const sortBy = sortMap[sort] || { createdAt: -1 }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Problem.countDocuments(filter)

  const problems = await Problem.find(filter)
    .populate('client', 'name avatar avgRating')
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit))

  res.json({ problems, total, page: Number(page), pages: Math.ceil(total / limit) })
})

// GET /api/problems/mine — own problems only
exports.getMyProblems = catchAsync(async (req, res) => {
  const problems = await Problem.find({ client: req.user._id })
    .sort({ createdAt: -1 })

  res.json({ problems })
})

// GET /api/problems/:id
exports.getProblem = catchAsync(async (req, res) => {
  const problem = await Problem.findById(req.params.id)
    .populate('client', 'name avatar avgRating totalJobs')
    .populate('solver', 'name avatar avgRating')

  if (!problem) return res.status(404).json({ message: 'Problem not found.' })

  // Increment view count
  problem.views += 1
  await problem.save({ validateBeforeSave: false })

  // Attach bids
  const Bid = require('../models/Bid')
  const bids = await Bid.find({ problem: problem._id })
    .populate('solver', 'name avatar avgRating totalJobs badge')
    .sort({ createdAt: -1 })

  res.json({ problem, bids })
})

exports.createProblem = catchAsync(async (req, res) => {
  const { title, description, category, budget, budgetMax, budgetType, deadline } = req.body

  // Attach uploaded file URLs from Cloudinary or local
  const files = (req.files || []).map((f) => ({
    name:     f.originalname,
    // If the path starts with http (Cloudinary), use it directly. Otherwise, use relative /uploads path
    url:      f.path.startsWith('http') ? f.path : `/uploads/${f.filename}`,
    publicId: f.filename,
  }))

  const problem = await Problem.create({
    client: req.user._id,
    title, description, category,
    budget: Number(budget),
    budgetMax: budgetMax ? Number(budgetMax) : undefined,
    budgetType,
    deadline: new Date(deadline),
    files,
  })

  res.status(201).json({ problem })
})

// PUT /api/problems/:id
exports.updateProblem = catchAsync(async (req, res) => {
  const problem = await Problem.findById(req.params.id)
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })
  if (String(problem.client) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not authorised.' })
  }
  if (problem.status !== 'open') {
    return res.status(400).json({ message: 'Cannot edit a problem that is already active.' })
  }

  const allowed = ['title', 'description', 'budget', 'budgetMax', 'deadline']
  allowed.forEach((f) => { if (req.body[f] !== undefined) problem[f] = req.body[f] })
  await problem.save()

  res.json({ problem })
})

// DELETE /api/problems/:id
exports.deleteProblem = catchAsync(async (req, res) => {
  const problem = await Problem.findById(req.params.id)
  if (!problem) return res.status(404).json({ message: 'Problem not found.' })

  const isOwner = String(problem.client) === String(req.user._id)
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorised.' })

  await problem.deleteOne()
  res.json({ message: 'Problem deleted.' })
})
