const router = require('express').Router()
const {
  getStats,
  getAllUsers,
  getUserById,
  toggleBan,
  getDisputes,
  getAllProblems,
  getActivityLog,
} = require('../controllers/admin.controller')
const { protect, restrictTo } = require('../middleware/auth')

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'))

// ── Analytics ────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', getStats)

// ── User management ──────────────────────────────────────
// GET  /api/admin/users          — list all users (with optional ?role= filter)
// GET  /api/admin/users/:id      — single user detail
// PUT  /api/admin/users/:id/ban  — toggle ban/unban
router.get('/users',          getAllUsers)
router.get('/users/:id',      getUserById)
router.put('/users/:id/ban',  toggleBan)

// ── Problem management ───────────────────────────────────
// GET /api/admin/problems  — all problems on the platform
router.get('/problems', getAllProblems)

// ── Dispute management ───────────────────────────────────
// GET /api/admin/disputes  — all disputes
router.get('/disputes', getDisputes)

// ── Activity log ─────────────────────────────────────────
// GET /api/admin/activity  — recent platform activity
router.get('/activity', getActivityLog)

module.exports = router
