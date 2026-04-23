const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

// ── Local fallback storage (used when Cloudinary not configured) ──
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})

const localUpload = multer({
  storage: localStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
})

// ── Try to set up Cloudinary (only if env vars are provided) ──────
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY    &&
  process.env.CLOUDINARY_API_SECRET

let uploadProblemFiles  = localUpload
let uploadSolutionFiles = localUpload
let uploadAvatar        = localUpload
let cloudinary          = null

if (hasCloudinary) {
  try {
    cloudinary = require('cloudinary').v2
    const { CloudinaryStorage } = require('multer-storage-cloudinary')

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const problemStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'solveit/problems',
        allowed_formats: ['jpg','jpeg','png','pdf','zip','txt','js','py'],
        resource_type: 'auto',
      },
    })

    const solutionStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'solveit/solutions',
        allowed_formats: ['jpg','jpeg','png','pdf','zip','txt','js','py'],
        resource_type: 'auto',
      },
    })

    const avatarStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'solveit/avatars',
        allowed_formats: ['jpg','jpeg','png','webp'],
        resource_type: 'image',
      },
    })

    uploadProblemFiles  = multer({ storage: problemStorage,  limits: { fileSize: 10 * 1024 * 1024 } })
    uploadSolutionFiles = multer({ storage: solutionStorage, limits: { fileSize: 10 * 1024 * 1024 } })
    uploadAvatar        = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } })
    console.log('☁️  Cloudinary storage configured')
  } catch (err) {
    console.warn('⚠️  Cloudinary setup failed, using local storage:', err.message)
  }
} else {
  console.log('📁 Using local file storage (Cloudinary not configured)')
}

module.exports = { cloudinary, uploadProblemFiles, uploadSolutionFiles, uploadAvatar }
