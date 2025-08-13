const mongoose = require("mongoose");

const FollowSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["user", "tag"], required: true, index: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetTag: { type: String, lowercase: true, trim: true },
  },
  { timestamps: true }
);

FollowSchema.index(
  { follower: 1, targetType: 1, targetUser: 1 },
  { unique: true, partialFilterExpression: { targetType: "user" } }
);
FollowSchema.index(
  { follower: 1, targetType: 1, targetTag: 1 },
  { unique: true, partialFilterExpression: { targetType: "tag" } }
);

module.exports = mongoose.model("Follow", FollowSchema);
