const router = require('express').Router()
const { getWallet, deposit, withdraw } = require('../controllers/payment.controller')
const { protect } = require('../middleware/auth')
const { body }    = require('express-validator')
const validate    = require('../middleware/validate')

const amountRules = [
  body('amount')
    .isNumeric().withMessage('Amount must be a number.')
    .custom(v => v > 0).withMessage('Amount must be greater than 0.'),
]

// GET  /api/wallet
router.get('/',          protect, getWallet)
// POST /api/wallet/deposit
router.post('/deposit',  protect, amountRules, validate, deposit)
// POST /api/wallet/withdraw
router.post('/withdraw', protect, amountRules, validate, withdraw)

module.exports = router
