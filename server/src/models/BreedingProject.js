const mongoose = require("mongoose");

const breedingPairSchema = new mongoose.Schema({
  breed1: { type: String, required: true },
  breed2: { type: String, required: true },
  maleId: { type: String, required: true },
  femaleId: { type: String, required: true },
  breedingDate: { type: Date, required: true },
  expectedHatchDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Active", "Hatched", "Failed", "Completed"],
    default: "Active",
  },
  notes: String,
  result: {
    name: String,
    characteristics: String,
    expectedTraits: {
      eggProduction: String,
      temperament: String,
      meatQuality: String,
      maturityRate: String,
      hybridVigor: String,
      featherColor: String,
      purpose: String,
      size: String,
    },
    geneticPredictions: {
      dominantTraits: [String],
      heterosisEffects: [String],
    },
    breedingConsiderations: [String],
    incubationPeriod: Number,
  },
});

const breedingProjectSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  pairs: [breedingPairSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
breedingProjectSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("BreedingProject", breedingProjectSchema);
