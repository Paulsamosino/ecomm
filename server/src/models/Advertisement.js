const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
    },
    type: {
      type: String,
      enum: ["banner", "square", "small"],
      required: true,
    },
    image: {
      type: String, // URL to the image
      default: null,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: "URL must be a valid HTTP/HTTPS URL"
      }
    },
    cta: {
      type: String, // Call to action text
      required: true,
      trim: true,
      maxLength: 50,
    },
    sponsor: {
      type: String, // Company/sponsor name
      required: true,
      trim: true,
      maxLength: 100,
    },
    price: {
      type: String, // Price display text (optional)
      trim: true,
      maxLength: 50,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "expired"],
      default: "draft",
    },
    targetAudience: {
      roles: [{
        type: String,
        enum: ["buyer", "seller", "all"],
        default: "buyer"
      }],
      locations: [String], // Optional geographic targeting
    },
    schedule: {
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: null, // null means no end date
      },
    },
    // Performance tracking
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    // Click tracking details
    clickDetails: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      userAgent: String,
      ipAddress: String,
    }],
    // Impression tracking details  
    impressionDetails: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      page: String, // Which page the ad was shown on
    }],
    // Admin tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Priority for ad display (higher number = higher priority)
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for calculating click-through rate
advertisementSchema.virtual("ctr").get(function () {
  if (this.impressions === 0) return 0;
  return ((this.clicks / this.impressions) * 100).toFixed(2);
});

// Virtual for checking if ad is currently active
advertisementSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  const withinSchedule = !this.schedule.endDate || now <= this.schedule.endDate;
  const afterStart = now >= this.schedule.startDate;
  return this.status === "active" && withinSchedule && afterStart;
});

// Virtual for ad performance summary
advertisementSchema.virtual("performance").get(function () {
  return {
    impressions: this.impressions,
    clicks: this.clicks,
    ctr: this.ctr,
    isActive: this.isCurrentlyActive,
    daysRunning: Math.ceil((Date.now() - this.schedule.startDate) / (1000 * 60 * 60 * 24)),
  };
});

// Ensure virtual fields are serialized
advertisementSchema.set("toJSON", { virtuals: true });

// Index for efficient querying
advertisementSchema.index({ status: 1, type: 1 });
advertisementSchema.index({ "schedule.startDate": 1, "schedule.endDate": 1 });
advertisementSchema.index({ priority: -1 });

// Pre-save middleware to update lastModifiedBy
advertisementSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // In a real app, get from request context
  }
  next();
});

// Static method to get active ads for display
advertisementSchema.statics.getActiveAds = function(type = null, limit = null) {
  const query = {
    status: "active",
    $or: [
      { "schedule.endDate": null },
      { "schedule.endDate": { $gte: new Date() } }
    ],
    "schedule.startDate": { $lte: new Date() }
  };

  if (type) {
    query.type = type;
  }

  let queryBuilder = this.find(query).sort({ priority: -1, createdAt: -1 });
  
  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  return queryBuilder;
};

// Static method to track impression
advertisementSchema.statics.trackImpression = async function(adId, userId = null, page = null) {
  const update = {
    $inc: { impressions: 1 }
  };

  if (userId || page) {
    update.$push = {
      impressionDetails: {
        userId: userId,
        page: page,
        timestamp: new Date()
      }
    };
  }

  return this.findByIdAndUpdate(adId, update, { new: true });
};

// Static method to track click
advertisementSchema.statics.trackClick = async function(adId, userId = null, userAgent = null, ipAddress = null) {
  const update = {
    $inc: { clicks: 1 }
  };

  if (userId || userAgent || ipAddress) {
    update.$push = {
      clickDetails: {
        userId: userId,
        userAgent: userAgent,
        ipAddress: ipAddress,
        timestamp: new Date()
      }
    };
  }

  return this.findByIdAndUpdate(adId, update, { new: true });
};

const Advertisement = mongoose.model("Advertisement", advertisementSchema);

module.exports = Advertisement;
