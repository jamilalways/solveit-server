const router = require('express').Router()
const {
  getContracts, getContract,
  submitSolution, completeContract,
} = require('../controllers/contract.controller')
const { protect, restrictTo } = require('../middleware/auth')

// Safe import of upload middleware
let uploadSolutionFiles
try {
  uploadSolutionFiles = require('../config/cloudinary').uploadSolutionFiles
} catch (e) {
  const multer = require('multer')
  uploadSolutionFiles = multer({ storage: multer.memoryStorage() })
}

router.get('/',    protect, getContracts)
router.get('/:id', protect, getContract)

router.post('/:id/submit',
  protect, restrictTo('solver'),
  uploadSolutionFiles.array('files', 10),
  submitSolution
)

router.put('/:id/complete', protect, restrictTo('client'), completeContract)

module.exports = router
