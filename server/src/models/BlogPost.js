const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: [true, "Please add content"],
    },
    excerpt: {
      type: String,
      required: [true, "Please add a short excerpt"],
      maxlength: [500, "Excerpt cannot be more than 500 characters"],
    },
    coverImage: {
      type: String,
      default: "/public/chicken.svg",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: [true, "Please specify a category"],
      enum: ["news", "events", "tips", "market", "health", "care", "breeding"],
      default: "news",
    },
    tags: [String],
    isPublished: {
      type: Boolean,
      default: true,
    },
    featuredPost: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    readTime: {
      type: Number,
      default: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from title
blogPostSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  }
  next();
});

// Update the updatedAt field on save
blogPostSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("BlogPost", blogPostSchema);
