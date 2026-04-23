const mongoose = require('mongoose')

const problemSchema = new mongoose.Schema({
  client:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  solver:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 5000 },
  category:    {
    type: String, required: true,
    enum: ['Programming', 'Design', 'Writing', 'Data & Excel', 'Mobile App', 'Security', 'AI / ML', 'Video / Media', 'Home Services', 'Creative Work', 'Maintenance', 'Agriculture', 'Other'],
  },

  budget:     { type: Number, required: true, min: 1 },
  budgetMax:  { type: Number },
  budgetType: { type: String, enum: ['fixed', 'range'], default: 'fixed' },
  deadline:   { type: Date,   required: true },

  files: [{
    name: String,
    url:  String,
    publicId: String,
  }],

  status: {
    type: String,
    enum: ['open', 'active', 'in_review', 'completed', 'cancelled', 'disputed'],
    default: 'open',
  },

  bidsCount: { type: Number, default: 0 },
  views:     { type: Number, default: 0 },
}, { timestamps: true })

// Indexes for fast querying
problemSchema.index({ category: 1, status: 1 })
problemSchema.index({ client: 1 })
problemSchema.index({ deadline: 1 })
problemSchema.index({ createdAt: -1 })
problemSchema.index({ title: 'text', description: 'text' })

module.exports = mongoose.model('Problem', problemSchema)
