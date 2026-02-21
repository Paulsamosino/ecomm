const mongoose = require("mongoose");

const ParentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    size: { type: Number, default: 50 },
    eggProd: { type: Number, default: 50 },
    feather: { type: String, default: "smooth" },
    color: { type: String, default: "white" },
  },
  { _id: false }
);

const OffspringSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    size: { type: Number, default: 50 },
    eggProd: { type: Number, default: 50 },
    feather: { type: String, default: "smooth" },
    color: { type: String, default: "white" },
  },
  { _id: false }
);

const BreedingLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    sellerAvatar: {
      type: String,
      default: null,
    },
    parent1: { type: ParentSchema, default: {} },
    parent2: { type: ParentSchema, default: {} },
    offspring: { type: OffspringSchema, default: {} },
    notes: {
      type: String,
      default: "",
    },
    sourceId: { type: String, default: null }, // local record id — for upsert dedup
  },
  { timestamps: true }
);

// Index for efficient newest-first queries
BreedingLogSchema.index({ createdAt: -1 });
BreedingLogSchema.index({ user: 1, sourceId: 1 }, { sparse: true });

module.exports = mongoose.model("BreedingLog", BreedingLogSchema);
