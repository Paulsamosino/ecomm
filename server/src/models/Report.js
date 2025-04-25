const mongoose = require("mongoose");

const statusUpdateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reporterRole: {
      type: String,
      enum: ["buyer", "seller"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    resolution: {
      type: String,
      default: "",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    statusHistory: [statusUpdateSchema],
    category: {
      type: String,
      enum: [
        "fraud",
        "harassment",
        "product_quality",
        "shipping",
        "payment",
        "communication",
        "other",
      ],
      required: true,
    },
    evidence: [
      {
        type: {
          type: String,
          enum: ["message", "order", "image", "other"],
        },
        reference: String,
        description: String,
      },
    ],
    relatedReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual for report age
reportSchema.virtual("ageInDays").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Middleware to add status updates to history
reportSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this.resolvedBy,
      timestamp: new Date(),
      note: this.resolution,
    });
  }
  next();
});

// Index for better query performance
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ status: 1, priority: 1 });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
