const mongoose = require("mongoose");

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    coverImage: { type: String },
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorType: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      required: true,
      index: true,
    },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    score: { type: Number, default: 0, index: true },
    commentsCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BlogPostSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("BlogPost", BlogPostSchema);
