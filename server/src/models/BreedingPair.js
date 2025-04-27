const mongoose = require("mongoose");

const breedingPairSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference to a male animal product
      required: true,
    },
    dam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference to a female animal product
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BreedingProject",
    },
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: Date,
    events: [
      {
        type: {
          type: String,
          enum: ["breeding", "egglaying", "hatching", "weaning", "other"],
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        outcome: String,
        count: Number, // For counting eggs, hatchlings, etc.
      },
    ],
    notes: String,
    expectedOffspring: {
      count: Number,
      traits: [String],
    },
    actualOffspring: {
      count: Number,
      offspring: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Reference to the resulting animal products
        },
      ],
    },
    geneticAnalysis: {
      predictedTraits: [
        {
          trait: String,
          probability: Number,
        },
      ],
      inheritancePattern: String,
      notes: String,
    },
    media: [
      {
        url: String,
        type: {
          type: String,
          enum: ["image", "video", "document"],
          default: "image",
        },
        caption: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
breedingPairSchema.index({ owner: 1, status: 1 });
breedingPairSchema.index({ project: 1 });
breedingPairSchema.index({ sire: 1, dam: 1 });

// Virtuals
breedingPairSchema.virtual("age").get(function () {
  return Math.floor((Date.now() - this.startDate) / (1000 * 60 * 60 * 24));
});

breedingPairSchema.virtual("progress").get(function () {
  // Calculate progress based on events and typical breeding cycle
  // This is a simplified example
  const eventTypes = this.events.map((e) => e.type);

  if (this.status === "completed") return 100;
  if (this.status === "failed") return 0;

  if (eventTypes.includes("hatching")) return 75;
  if (eventTypes.includes("egglaying")) return 50;
  if (eventTypes.includes("breeding")) return 25;

  return 10; // Just started
});

// Methods
breedingPairSchema.methods.addEvent = async function (eventData) {
  this.events.push(eventData);

  // Update status based on event type if needed
  if (eventData.type === "hatching" && eventData.outcome === "success") {
    this.status = "completed";
    this.completionDate = new Date();
  }

  await this.save();
  return this;
};

breedingPairSchema.methods.updateStatus = async function (newStatus) {
  this.status = newStatus;

  if (newStatus === "completed") {
    this.completionDate = new Date();
  }

  await this.save();
  return this;
};

const BreedingPair = mongoose.model("BreedingPair", breedingPairSchema);

module.exports = BreedingPair;
