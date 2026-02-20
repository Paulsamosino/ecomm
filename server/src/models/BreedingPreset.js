const mongoose = require("mongoose");

const BreedingPresetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    eggProd: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    feather: {
      type: String,
      enum: ["smooth", "curly", "frizzle"],
      default: "smooth",
    },
    colorName: {
      type: String,
      default: "White",
    },
    colorHex: {
      type: String,
      default: "#F8FAFC",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BreedingPreset", BreedingPresetSchema);
