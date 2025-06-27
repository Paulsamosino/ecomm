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
    delivery: {
      lalamoveOrderId: String,
      status: {
        type: String,
        enum: [
          "pending",
          "assigned",
          "picked_up",
          "in_progress",
          "completed",
          "cancelled",
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

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
