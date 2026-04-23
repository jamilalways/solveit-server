const router = require('express').Router()
const {
  getProblems, getProblem, getMyProblems,
  createProblem, updateProblem, deleteProblem,
} = require('../controllers/problem.controller')
const { submitBid, getBids } = require('../controllers/bid.controller')
const { protect, restrictTo } = require('../middleware/auth')
const { body }   = require('express-validator')
const validate   = require('../middleware/validate')

// Safe import of upload middleware
let uploadProblemFiles
try {
  uploadProblemFiles = require('../config/cloudinary').uploadProblemFiles
} catch (e) {
  const multer = require('multer')
  uploadProblemFiles = multer({ storage: multer.memoryStorage() })
}

const createRules = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('description').trim().isLength({ min: 30 }).withMessage('Description must be at least 30 characters.'),
  body('category').notEmpty().withMessage('Category is required.'),
  body('budget').isNumeric().withMessage('Budget must be a number.'),
  body('budgetMax').optional({ checkFalsy: true }).isNumeric().withMessage('Max budget must be a number.'),
  body('deadline').isISO8601().withMessage('Valid deadline date is required.'),
]

const bidRules = [
  body('proposedPrice').isNumeric().withMessage('Proposed price must be a number.'),
  body('deliveryDays').isInt({ min: 1 }).withMessage('Delivery days must be at least 1.'),
  body('message').trim().isLength({ min: 20 }).withMessage('Message must be at least 20 characters.'),
]

// Public routes
router.get('/',    getProblems)

// My problems — must be BEFORE /:id to avoid route conflict
router.get('/mine', protect, restrictTo('client'), getMyProblems)

router.get('/:id', getProblem)

// Client only
router.post('/',
  protect, restrictTo('client'),
  uploadProblemFiles.array('files', 5),
  createRules, validate,
  createProblem
)
router.put('/:id',    protect, restrictTo('client'), updateProblem)
router.delete('/:id', protect, deleteProblem)

// Bid sub-routes
router.get('/:id/bids',  protect, restrictTo('client'), getBids)
router.post('/:id/bids', protect, restrictTo('solver'), bidRules, validate, submitBid)

module.exports = router
