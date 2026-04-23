const User   = require('../models/User')
const Review = require('../models/Review')

exports.recalcBadge = async (userId) => {
  const user = await User.findById(userId)
  if (!user || user.role !== 'solver') return

  // Recalculate average rating
  const reviews = await Review.find({ reviewee: userId })
  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    user.avgRating    = Math.round(avg * 10) / 10
    user.totalReviews = reviews.length
  }

  user.updateBadge()
  await user.save()
}
