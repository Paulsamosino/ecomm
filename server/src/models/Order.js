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
        enum: ["credit_card", "debit_card", "bank_transfer", "paypal"],
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
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "completed",
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
    trackingNumber: String,
    review: {
      rating: Number,
      comment: String,
      createdAt: Date,
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
  delivered: ["completed", "refunded"],
  completed: ["refunded"],
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

    // Add timestamp for status change
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: this.notes,
    });

    // Status-specific validations
    if (this.status === "shipped" && !this.trackingNumber) {
      return next(new Error("Tracking number is required for shipped status"));
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

// Update inventory and notify seller when order is completed
orderSchema.pre("save", async function (next) {
  if (this.isModified("status") && this.status === "completed") {
    const Product = mongoose.model("Product");
    const User = mongoose.model("User");

    try {
      // Update seller statistics
      const seller = await User.findById(this.seller);
      if (seller && seller.sellerProfile) {
        seller.sellerProfile.totalSales =
          (seller.sellerProfile.totalSales || 0) + this.totalAmount;
        seller.sellerProfile.completedOrders =
          (seller.sellerProfile.completedOrders || 0) + 1;
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
  this.status = "refunded";
  this.paymentInfo.status = "refunded";
  this.paymentInfo.refundId = refundId;

  // Restore inventory
  const Product = mongoose.model("Product");
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.quantity += item.quantity;
      await product.save();
    }
  }

  return this.save();
};

// Get seller revenue (excluding platform fee)
orderSchema.methods.getSellerRevenue = function () {
  return this.totalAmount - this.paymentInfo.platformFee;
};

// Get orders for a specific seller
orderSchema.statics.getSellerOrders = function (sellerId) {
  return this.find({
    "items.seller": sellerId,
  }).populate("buyer", "name email");
};

// Get orders for a specific buyer
orderSchema.statics.getBuyerOrders = function (buyerId) {
  return this.find({
    buyer: buyerId,
  }).populate("items.seller", "name email sellerProfile");
};

// Calculate revenue for a seller within a date range
orderSchema.statics.calculateSellerRevenue = async function (
  sellerId,
  startDate,
  endDate
) {
  const orders = await this.find({
    "items.seller": sellerId,
    status: "completed",
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  return orders.reduce((total, order) => {
    const sellerItems = order.items.filter(
      (item) => item.seller.toString() === sellerId.toString()
    );
    return (
      total +
      sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
  }, 0);
};

// Add method to check if order is reviewable
orderSchema.methods.isReviewable = function () {
  return this.status === "completed" && !this.review;
};

// Add method to create review
orderSchema.methods.createReview = async function (reviewData) {
  if (!this.isReviewable()) {
    throw new Error("Order is not eligible for review");
  }

  const Product = mongoose.model("Product");
  const User = mongoose.model("User");

  // Add review to each product in the order
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.reviews.push({
        user: this.buyer,
        rating: reviewData.rating,
        comment: reviewData.comment,
        order: this._id,
      });
      await product.save();
    }
  }

  // Update seller's rating
  const seller = await User.findById(this.seller);
  if (seller && seller.sellerProfile) {
    seller.sellerProfile.reviews.push({
      user: this.buyer,
      rating: reviewData.rating,
      comment: reviewData.comment,
      order: this._id,
    });
    await seller.save();
  }

  this.review = {
    rating: reviewData.rating,
    comment: reviewData.comment,
    createdAt: new Date(),
  };

  return this.save();
};

// Add method to update shop statistics
orderSchema.methods.updateShopStatistics = async function () {
  const User = mongoose.model("User");
  const seller = await User.findById(this.seller);

  if (seller?.sellerProfile) {
    if (this.status === "completed") {
      seller.sellerProfile.statistics = seller.sellerProfile.statistics || {};
      seller.sellerProfile.statistics.totalOrders =
        (seller.sellerProfile.statistics.totalOrders || 0) + 1;
      seller.sellerProfile.statistics.totalRevenue =
        (seller.sellerProfile.statistics.totalRevenue || 0) +
        this.getSellerRevenue();
      seller.sellerProfile.statistics.lastOrderDate = new Date();

      // Calculate average order value
      const completedOrders = await this.constructor.find({
        seller: this.seller,
        status: "completed",
      });

      const totalValue = completedOrders.reduce(
        (sum, order) => sum + order.getSellerRevenue(),
        0
      );
      seller.sellerProfile.statistics.averageOrderValue =
        totalValue / completedOrders.length;
    }

    // Update conversion rate
    const allOrders = await this.constructor.countDocuments({
      seller: this.seller,
    });
    const completedOrders = await this.constructor.countDocuments({
      seller: this.seller,
      status: "completed",
    });

    seller.sellerProfile.statistics.conversionRate =
      (completedOrders / allOrders) * 100;

    await seller.save();
  }
};

// Update order hooks to include statistics
orderSchema.pre("save", async function (next) {
  if (this.isModified("status")) {
    try {
      await this.updateShopStatistics();
    } catch (error) {
      console.error("Error updating shop statistics:", error);
      // Don't fail the order update if statistics fail
    }
  }
  next();
});

// Add method to check stock levels and notify seller
orderSchema.methods.checkStockLevels = async function () {
  const Product = mongoose.model("Product");
  const lowStockThreshold = 5; // Configure this as needed

  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product && product.quantity <= lowStockThreshold) {
      // Send low stock notification
      try {
        await sendEmail({
          to: this.seller.email,
          subject: "Low Stock Alert",
          text: `Product "${product.name}" is running low on stock (${product.quantity} remaining).`,
        });
      } catch (error) {
        console.error("Error sending low stock notification:", error);
      }
    }
  }
};

// Add helper method for order metrics
orderSchema.statics.getSellerMetrics = async function (
  sellerId,
  timeframe = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const metrics = await this.aggregate([
    {
      $match: {
        seller: new mongoose.Types.ObjectId(sellerId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
        cancelledOrders: {
          $sum: {
            $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
          },
        },
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, "$totalAmount", 0],
          },
        },
        averageOrderValue: { $avg: "$totalAmount" },
      },
    },
  ]);

  return (
    metrics[0] || {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    }
  );
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
