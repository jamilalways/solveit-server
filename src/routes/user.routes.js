const router = require('express').Router()
const multer = require('multer')
const path   = require('path')
const { getProfile, updateProfile } = require('../controllers/user.controller')
const { getUserReviews } = require('../controllers/review.controller')
const { protect } = require('../middleware/auth')
const { uploadAvatar } = require('../config/cloudinary')

router.get('/:id',         getProfile)
router.get('/:id/reviews', getUserReviews)
router.put('/me',          protect, uploadAvatar.single('avatar'), updateProfile)

module.exports = router
