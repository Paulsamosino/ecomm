const mongoose = require("mongoose");

const BlogCommentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "BlogPost", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true },
    status: { type: String, enum: ["visible", "hidden"], default: "visible", index: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    score: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlogComment", BlogCommentSchema);
