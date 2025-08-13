const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["post", "comment"], required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    value: { type: Number, enum: [1, -1], required: true },
  },
  { timestamps: true }
);

VoteSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", VoteSchema);
