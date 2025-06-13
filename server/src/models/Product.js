const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: ["chicken", "duck", "quail", "turkey", "other"],
    },
    breed: {
      type: String,
      required: [true, "Product breed is required"],
    },
    age: {
      type: Number,
      required: [true, "Product age is required"],
      min: [0, "Age cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    images: [
      {
        type: String,
        required: [true, "At least one image is required"],
      },
    ],
    location: {
      type: String,
      default: "Not specified",
    },
    shippingInfo: {
      type: String,
      default: "Standard shipping available",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "out_of_stock"],
      default: "active",
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for search functionality
productSchema.index({ name: "text", description: "text", breed: "text" });

// Calculate average rating before saving
productSchema.pre("save", function (next) {
  if (this.reviews.length > 0) {
    this.averageRating =
      this.reviews.reduce((acc, review) => acc + review.rating, 0) /
      this.reviews.length;
    this.numReviews = this.reviews.length;
  }
  next();
});

// Update stock status
productSchema.pre("save", function (next) {
  if (this.quantity <= 0) {
    this.status = "out_of_stock";
  } else if (this.status === "out_of_stock" && this.quantity > 0) {
    this.status = "active";
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
