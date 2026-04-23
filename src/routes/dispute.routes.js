const router = require('express').Router()
const {
  createDispute,
  getAllDisputes,
  resolveDispute,
} = require('../controllers/dispute.controller')
const { protect, restrictTo } = require('../middleware/auth')
const { body }   = require('express-validator')
const validate   = require('../middleware/validate')

// Validation rules
const disputeRules = [
  body('contractId')
    .notEmpty().withMessage('Contract ID is required.'),
  body('reason')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Please provide a detailed reason (minimum 20 characters).'),
]

const resolveRules = [
  body('resolution')
    .isIn(['client_wins', 'solver_wins'])
    .withMessage('Resolution must be either client_wins or solver_wins.'),
]

// ── Client / Solver ──────────────────────────────────────
// POST /api/disputes  — raise a dispute
router.post('/', protect, disputeRules, validate, createDispute)

// ── Admin only ───────────────────────────────────────────
// GET /api/disputes               — list all disputes
// PUT /api/disputes/:id/resolve   — resolve a dispute
router.get('/',                protect, restrictTo('admin'), getAllDisputes)
router.put('/:id/resolve',     protect, restrictTo('admin'), resolveRules, validate, resolveDispute)

module.exports = router
