const router = require('express').Router()
const { lockEscrowRoute } = require('../controllers/payment.controller')
const { protect, restrictTo } = require('../middleware/auth')

// POST /api/payments/escrow/:contractId  — lock funds into escrow
router.post('/escrow/:contractId', protect, restrictTo('client'), lockEscrowRoute)

module.exports = router
