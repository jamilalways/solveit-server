const router = require('express').Router()
const {
  getConversations,
  getOrCreateConversation,
  getDirectMessages,
  sendDirectMessage,
} = require('../controllers/dm.controller')
const { protect } = require('../middleware/auth')
const { body }    = require('express-validator')
const validate    = require('../middleware/validate')

const msgRules = [
  body('text').trim().notEmpty().withMessage('Message text is required.'),
]

router.get('/',                          protect, getConversations)
router.post('/start/:userId',            protect, getOrCreateConversation)
router.get('/:conversationId/messages',  protect, getDirectMessages)
router.post('/:conversationId/messages', protect, msgRules, validate, sendDirectMessage)

module.exports = router
