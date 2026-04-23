const router = require('express').Router()
const { createReview } = require('../controllers/review.controller')
const { protect }      = require('../middleware/auth')
const { body }         = require('express-validator')
const validate         = require('../middleware/validate')

const reviewRules = [
  body('contractId').notEmpty().withMessage('Contract ID is required.'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
  body('comment').trim().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters.'),
]

router.post('/', protect, reviewRules, validate, createReview)

module.exports = router
