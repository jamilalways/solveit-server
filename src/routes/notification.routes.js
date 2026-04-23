const router = require('express').Router()
const { getNotifications, markAllRead } = require('../controllers/notification.controller')
const { protect } = require('../middleware/auth')

router.get('/',        protect, getNotifications)
router.put('/read',    protect, markAllRead)

module.exports = router
