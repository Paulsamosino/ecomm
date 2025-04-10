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
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        seller: {
          type: mongoose.Schema.ObjectId,
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
    },
    paymentInfo: {
      method: {
        type: String,
        required: true,
        enum: ["credit_card", "debit_card", "bank_transfer"],
      },
      status: {
        type: String,
        required: true,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
      transactionId: String,
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
  },
  {
    timestamps: true,
  }
);

// Calculate total amount before saving
orderSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  }
  next();
});

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

module.exports = mongoose.model("Order", orderSchema);
