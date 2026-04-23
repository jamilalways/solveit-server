const router = require('express').Router()
const { acceptBid, rejectBid, getMyBids, getIncomingBids } = require('../controllers/bid.controller')
const { protect, restrictTo }  = require('../middleware/auth')

router.get('/mine', protect, restrictTo('solver'), getMyBids)
router.get('/incoming', protect, restrictTo('client'), getIncomingBids)
router.put('/:id/accept', protect, restrictTo('client'), acceptBid)
router.put('/:id/reject', protect, restrictTo('client'), rejectBid)

module.exports = router
