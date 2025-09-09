const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        // Snapshot warranty information at time of purchase so order retains warranty
        warrantyPeriod: {
          type: String,
          default: "",
        },
        warrantyDetails: {
          type: String,
          default: "",
        },
      },
    ],
    shippingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    paymentInfo: {
      method: {
        type: String,
        required: true,
        enum: ["credit_card", "debit_card", "bank_transfer", "paypal", "cod", "wallet"],
      },
      status: {
        type: String,
        required: true,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: {
        type: String,
        required: true,
      },
      refundId: String,
      platformFee: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    delivery: {
      lalamoveOrderId: String,
      status: {
        type: String,
        enum: [
          "pending",
          "ASSIGNING_DRIVER",
          "ON_GOING",
          "PICKED_UP",
          "COMPLETED",
          "CANCELLED",
          "EXPIRED",
          "REJECTED",
          "DRIVER_CANCELLED",
          "SYSTEM_CANCELLED",
        ],
        default: "pending",
      },
      price: {
        amount: Number,
        currency: String,
      },
      driver: {
        name: String,
        phone: String,
        plate: String,
        photo: String,
      },
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: String,
    reviewed: {
      type: Boolean,
      default: false,
    },
    reviewData: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: Date,
    },
    // Cancellation / Refund metadata
    refundRequested: {
      type: Boolean,
      default: false,
    },
    refundRequestedAt: Date,
    refundReason: String,
    refundProcessed: {
      type: Boolean,
      default: false,
    },
    refundedAt: Date,
    cancelReason: String,
    cancelledAt: Date,
    inventoryRestored: {
      type: Boolean,
      default: false,
    },
    // Evidence images for refund requests
    refundEvidence: [
      {
        url: String,
        publicId: String,
      },
    ],
    refundDecision: {
      status: {
        type: String,
        enum: ["pending", "approved", "declined"],
        default: "pending",
      },
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      decidedAt: Date,
      decisionReason: String,
    },
  },
  {
    timestamps: true,
  }
);

// Define valid status transitions
const validStatusTransitions = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

// Status transition validation
orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const oldStatus = this._original ? this._original.status : null;

    // Skip validation for new orders
    if (!oldStatus) {
      return next();
    }

    // Check if the transition is valid
    if (!validStatusTransitions[oldStatus].includes(this.status)) {
      return next(
        new Error(
          `Invalid status transition from ${oldStatus} to ${this.status}`
        )
      );
    }
  }
  next();
});

// Store original status for transition validation
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    next();
    return;
  }

  this._original = this.toObject();
  next();
});

// Update inventory and notify seller when order is delivered
orderSchema.pre("save", async function (next) {
  if (this.isModified("status") && this.status === "delivered") {
    const Product = mongoose.model("Product");
    const User = mongoose.model("User");

    try {
      // Update seller statistics
      const seller = await User.findById(this.seller);
      if (seller && seller.sellerProfile) {
        seller.sellerProfile.totalSales =
          (seller.sellerProfile.totalSales || 0) + this.totalAmount;
        seller.sellerProfile.deliveredOrders =
          (seller.sellerProfile.deliveredOrders || 0) + 1;
        await seller.save();
      }

      // Update product statistics
      for (const item of this.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.totalSales = (product.totalSales || 0) + item.quantity;
          await product.save();
        }
      }
    } catch (error) {
      next(error);
      return;
    }
  }
  next();
});

// Calculate total amount and platform fee before saving
orderSchema.pre("save", async function (next) {
  if (this.isModified("items")) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Calculate platform fee (2%)
    this.paymentInfo.platformFee = this.totalAmount * 0.02;
  }

  // Update inventory if order is being created
  if (this.isNew) {
    try {
      const Product = mongoose.model("Product");

      for (const item of this.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product ${item.product} not found`);
        }

        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        product.quantity -= item.quantity;
        await product.save();
      }
    } catch (error) {
      next(error);
      return;
    }
  }
  next();
});

// Handle refunds
orderSchema.methods.refund = async function (refundId) {
  // Idempotent refund processing
  if (this.status === 'refunded' && this.refundProcessed) {
    return this; // already refunded
  }

  this.status = "refunded";
  this.paymentInfo.status = "refunded";
  this.paymentInfo.refundId = refundId;
  this.refundProcessed = true;
  this.refundedAt = new Date();

  // Restore inventory only once
  if (!this.inventoryRestored) {
    const Product = mongoose.model("Product");
    for (const item of this.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }
    this.inventoryRestored = true;
  }

  return this.save();
};

// Cancel an order (buyer-initiated)
orderSchema.methods.cancel = async function (reason) {
  // Only allow cancelling if order is not already cancelled or refunded
  if (this.status === 'cancelled') return this;
  if (this.status === 'refunded') return this;

  // Allowed transitions: pending, processing, shipped -> cancelled (pre-check done by validStatusTransitions on save)
  this.status = 'cancelled';
  this.cancelReason = reason || '';
  this.cancelledAt = new Date();

  // Restore inventory only once
  if (!this.inventoryRestored) {
    const Product = mongoose.model('Product');
    for (const item of this.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }
    this.inventoryRestored = true;
  }

  return this.save();
};

// Create a review for the order
orderSchema.methods.createReview = async function (reviewData) {
  const { rating, comment } = reviewData;

  // Validate input
  if (!rating || !comment) {
    throw new Error("Rating and comment are required");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Check if order is eligible for review (delivered status)
  if (this.status !== "delivered") {
    throw new Error("You can only review delivered orders");
  }

  // Check if already reviewed
  if (this.reviewed) {
    throw new Error("This order has already been reviewed");
  }

  // Import Product model
  const Product = mongoose.model("Product");

  // Add review to each product in the order
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      // Check if user has already reviewed this specific product
      const existingReview = product.reviews.find(
        (review) => review.user.toString() === this.buyer.toString()
      );

      if (!existingReview) {
        // Add the review to the product
        const newReview = {
          user: this.buyer,
          rating: Number(rating),
          comment: comment.trim(),
          createdAt: new Date(),
        };

        product.reviews.push(newReview);
        await product.save(); // This will trigger the pre-save hook to update averageRating
      }
    }
  }

  // Mark order as reviewed
  this.reviewed = true;
  this.reviewData = {
    rating: Number(rating),
    comment: comment.trim(),
    createdAt: new Date(),
  };

  return this.save();
};

// Static method to get seller metrics
orderSchema.statics.getSellerMetrics = async function (
  sellerId,
  timeframe = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  // Total orders in timeframe
  const totalOrders = await this.countDocuments({
    seller: sellerId,
    createdAt: { $gte: startDate },
  });

  // Delivered orders in timeframe
  const deliveredOrders = await this.countDocuments({
    seller: sellerId,
    status: "delivered",
    createdAt: { $gte: startDate },
  });

  // Total revenue in timeframe
  const revenueAgg = await this.aggregate([
    {
      $match: {
        seller: mongoose.Types.ObjectId(sellerId),
        status: "delivered",
        createdAt: { $gte: startDate },
      },
    },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

  // Conversion rate: delivered/total (avoid div by zero)
  const conversionRate =
    totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

  // Recent orders (last 5)
  const recentOrders = await this.find({
    seller: sellerId,
    createdAt: { $gte: startDate },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("buyer", "name email");

  // Top products (by quantity sold)
  const topProducts = await this.aggregate([
    {
      $match: {
        seller: mongoose.Types.ObjectId(sellerId),
        status: "delivered",
        createdAt: { $gte: startDate },
      },
    },
    { $unwind: "$items" },
    {
      $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" } },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  return {
    totalOrders,
    deliveredOrders,
    totalRevenue,
    conversionRate,
    recentOrders,
    topProducts,
  };
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
