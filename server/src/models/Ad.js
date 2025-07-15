const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  },
  price: {
    type: String,
    default: ''
  },
  ctaText: {
    type: String,
    default: 'Learn More'
  },
  type: {
    type: String,
    enum: ['banner', 'square', 'small'],
    default: 'banner'
  },
  backgroundColor: {
    type: String,
    default: 'from-blue-500 to-blue-600'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  clickCount: {
    type: Number,
    default: 0
  },
  impressionCount: {
    type: Number,
    default: 0
  },
  uniqueViewers: {
    type: [String],
    default: []
  },
  clicks: [{
    userId: String,
    userAgent: String,
    ipAddress: String,
    timestamp: { type: Date, default: Date.now }
  }],
  impressions: [{
    userId: String,
    userAgent: String,
    ipAddress: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
AdSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
AdSchema.index({ status: 1, type: 1 });
AdSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ad', AdSchema);
