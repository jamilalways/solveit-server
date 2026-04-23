const Review   = require('../models/Review')
const Contract = require('../models/Contract')
const { catchAsync } = require('../utils/response')
const { recalcBadge } = require('../services/badge.service')

// POST /api/reviews
exports.createReview = catchAsync(async (req, res) => {
  const { contractId, rating, comment } = req.body

  const contract = await Contract.findById(contractId)
  if (!contract) return res.status(404).json({ message: 'Contract not found.' })
  if (contract.status !== 'completed') {
    return res.status(400).json({ message: 'You can only review after a contract is completed.' })
  }

  const isParty =
    String(contract.client) === String(req.user._id) ||
    String(contract.solver) === String(req.user._id)
  if (!isParty) return res.status(403).json({ message: 'Access denied.' })

  // Determine who is being reviewed
  const reviewee =
    String(contract.client) === String(req.user._id)
      ? contract.solver
      : contract.client

  const existing = await Review.findOne({ contract: contractId, reviewer: req.user._id })
  if (existing) return res.status(400).json({ message: 'You have already reviewed this contract.' })

  const review = await Review.create({
    contract: contractId,
    reviewer: req.user._id,
    reviewee,
    rating: Number(rating),
    comment,
  })

  // Recalculate badge for the reviewee
  await recalcBadge(reviewee)

  const populated = await review.populate('reviewer', 'name avatar')
  res.status(201).json({ review: populated })
})

// GET /api/users/:id/reviews
exports.getUserReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.id })
    .populate('reviewer', 'name avatar')
    .sort({ createdAt: -1 })
  res.json({ reviews })
})
