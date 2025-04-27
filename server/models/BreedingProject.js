const mongoose = require("mongoose");

const breedingProjectSchema = new mongoose.Schema(
  {
    // Project information
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: String,
    goal: {
      type: String,
      enum: ["Show", "Pet", "Working", "Conservation", "Research", "Other"],
      required: true,
    },

    // Project timeline
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetCompletionDate: Date,
    actualCompletionDate: Date,
    status: {
      type: String,
      enum: ["Planning", "In Progress", "Completed", "On Hold", "Cancelled"],
      default: "Planning",
    },

    // Breeding plan
    generations: [
      {
        number: Number,
        pairs: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BreedingPair",
          },
        ],
        expectedTraits: [
          {
            trait: String,
            probability: Number,
          },
        ],
        notes: String,
        status: {
          type: String,
          enum: ["Planned", "In Progress", "Completed"],
          default: "Planned",
        },
      },
    ],

    // Genetic goals
    targetTraits: [
      {
        trait: String,
        priority: {
          type: String,
          enum: ["High", "Medium", "Low"],
          default: "Medium",
        },
      },
    ],
    healthConsiderations: [
      {
        issue: String,
        mitigation: String,
      },
    ],

    // Collaboration
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["Viewer", "Editor", "Manager"],
          default: "Viewer",
        },
      },
    ],

    // Documentation
    documents: [
      {
        title: String,
        fileUrl: String,
        uploadDate: { type: Date, default: Date.now },
        type: {
          type: String,
          enum: ["Health Certificate", "Pedigree", "Test Results", "Other"],
        },
      },
    ],

    // Progress tracking
    milestones: [
      {
        description: String,
        targetDate: Date,
        completedDate: Date,
        status: {
          type: String,
          enum: ["Pending", "Completed", "Missed"],
          default: "Pending",
        },
      },
    ],

    // Business metrics
    budget: {
      planned: Number,
      actual: Number,
    },
    revenue: {
      projected: Number,
      actual: Number,
    },

    // Metadata
    tags: [String],
    isPublic: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
breedingProjectSchema.index({ owner: 1, status: 1 });
breedingProjectSchema.index({ "collaborators.user": 1 });
breedingProjectSchema.index({ tags: 1 });

// Virtual for progress calculation
breedingProjectSchema.virtual("progress").get(function () {
  if (!this.milestones.length) return 0;
  const completed = this.milestones.filter(
    (m) => m.status === "Completed"
  ).length;
  return (completed / this.milestones.length) * 100;
});

// Methods
breedingProjectSchema.methods.addGeneration = async function (generationData) {
  this.generations.push({
    number: this.generations.length + 1,
    ...generationData,
  });
  await this.save();
};

breedingProjectSchema.methods.updateStatus = async function (newStatus) {
  this.status = newStatus;
  if (newStatus === "Completed") {
    this.actualCompletionDate = new Date();
  }
  await this.save();
};

breedingProjectSchema.methods.calculateROI = function () {
  if (!this.budget.actual || !this.revenue.actual) return null;
  return (
    ((this.revenue.actual - this.budget.actual) / this.budget.actual) * 100
  );
};

const BreedingProject = mongoose.model(
  "BreedingProject",
  breedingProjectSchema
);

module.exports = BreedingProject;
