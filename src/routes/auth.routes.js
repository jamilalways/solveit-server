const router  = require('express').Router()
const { register, login, getMe, logout, forgotPassword, resetPassword } = require('../controllers/auth.controller')
const { protect }     = require('../middleware/auth')
const { body }        = require('express-validator')
const validate        = require('../middleware/validate')

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('role').optional().isIn(['client', 'solver']).withMessage('Role must be client or solver.'),
]

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
]

const resetRules = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
]

router.post('/register', registerRules, validate, register)
router.post('/login',    loginRules,    validate, login)
router.post('/logout',   protect, logout)
router.get('/me',        protect, getMe)

router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword)
router.post('/reset-password/:token', resetRules, validate, resetPassword)

module.exports = router
