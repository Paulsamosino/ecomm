const mongoose = require("mongoose");

const adCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    advertiser: {
      company: {
        type: String,
        required: true,
        trim: true,
      },
      contactEmail: {
        type: String,
        required: true,
      },
      website: {
        type: String,
      }
    },
    budget: {
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      spent: {
        type: Number,
        default: 0,
        min: 0,
      },
      dailyLimit: {
        type: Number,
        min: 0,
      },
    },
    schedule: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "cancelled"],
      default: "draft",
    },
    objectives: {
      type: String,
      enum: ["brand_awareness", "traffic", "engagement", "conversions"],
      default: "brand_awareness",
    },
    totalImpressions: {
      type: Number,
      default: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for campaign performance
adCampaignSchema.virtual("performance").get(function () {
  return {
    ctr: this.totalImpressions > 0 ? (this.totalClicks / this.totalImpressions * 100).toFixed(2) : 0,
    costPerClick: this.totalClicks > 0 ? (this.totalSpent / this.totalClicks).toFixed(2) : 0,
    budgetUsed: this.budget.total > 0 ? (this.budget.spent / this.budget.total * 100).toFixed(2) : 0,
    remainingBudget: this.budget.total - this.budget.spent,
    isActive: this.status === "active" && new Date() >= this.schedule.startDate && new Date() <= this.schedule.endDate,
  };
});

// Ensure virtual fields are serialized
adCampaignSchema.set("toJSON", { virtuals: true });

// Pre-save hook to validate dates
adCampaignSchema.pre("save", function (next) {
  if (this.schedule.endDate <= this.schedule.startDate) {
    return next(new Error("End date must be after start date"));
  }
  next();
});

module.exports = mongoose.model("AdCampaign", adCampaignSchema);
