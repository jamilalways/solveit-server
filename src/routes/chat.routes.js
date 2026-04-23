const router = require('express').Router()
const { getMessages, sendMessage } = require('../controllers/chat.controller')
const { protect } = require('../middleware/auth')
const { body }    = require('express-validator')
const validate    = require('../middleware/validate')

const msgRules = [
  body('text').trim().notEmpty().withMessage('Message text is required.'),
]

router.get('/:contractId',  protect, getMessages)
router.post('/:contractId', protect, msgRules, validate, sendMessage)

module.exports = router
