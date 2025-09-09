const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema({
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
    default: "Philippines",
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
      default: "",
    },
    profilePicture: {
      type: String,
      required: false,
      default: "",
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    address: {
      type: addressSchema,
      required: false,
    },
    sellerProfile: {
      businessName: String,
      description: String,
      logo: String,
      location: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phone: String,
      },
      totalSales: {
        type: Number,
        default: 0,
      },
      completedOrders: {
        type: Number,
        default: 0,
      },
      ratings: {
        average: {
          type: Number,
          default: 0,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
      reviews: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          rating: Number,
          comment: String,
          createdAt: Date,
        },
      ],
      statistics: {
        totalOrders: {
          type: Number,
          default: 0,
        },
        totalRevenue: {
          type: Number,
          default: 0,
        },
        lastOrderDate: Date,
        averageOrderValue: {
          type: Number,
          default: 0,
        },
        conversionRate: {
          type: Number,
          default: 0,
        },
      },
    },
    orderHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    addresses: [
      {
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
          default: "Philippines",
        },
        phone: {
          type: String,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      orderUpdates: {
        type: Boolean,
        default: true,
      },
      promotions: {
        type: Boolean,
        default: true,
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "PHP",
      },
      transactions: [
        {
          type: {
            type: String,
            enum: ["topup", "refund", "purchase", "adjustment"],
          },
          amount: Number,
          meta: mongoose.Schema.Types.Mixed,
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and return JWT token
userSchema.methods.getSignedJwtToken = function () {
  const jwt = require("jsonwebtoken");
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Get rating
userSchema.methods.getRating = function () {
  if (!this.sellerProfile?.reviews?.length) {
    return 0;
  }

  const totalRating = this.sellerProfile.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  return totalRating / this.sellerProfile.reviews.length;
};

// Update seller statistics
userSchema.methods.updateStatistics = async function () {
  if (this.role !== "seller") return;

  const Order = mongoose.model("Order");

  const completedOrders = await Order.find({
    seller: this._id,
    status: "completed",
  });

  this.sellerProfile.statistics = {
    totalOrders: completedOrders.length,
    totalRevenue: completedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    ),
    lastOrderDate: completedOrders.length
      ? completedOrders[completedOrders.length - 1].createdAt
      : null,
    averageOrderValue:
      completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => sum + order.totalAmount, 0) /
          completedOrders.length
        : 0,
  };

  await this.save();
};

// Wallet helper methods (attached to schema to be available on instances)
userSchema.methods.creditWallet = async function (amount, type = "topup", meta = {}) {
  if (amount <= 0) throw new Error("Amount must be positive");
  this.wallet = this.wallet || { balance: 0, currency: "PHP", transactions: [] };
  this.wallet.balance = (this.wallet.balance || 0) + amount;
  this.wallet.transactions.push({ type, amount, meta });
  await this.save();
  return this.wallet;
};

userSchema.methods.debitWallet = async function (amount, type = "purchase", meta = {}) {
  if (amount <= 0) throw new Error("Amount must be positive");
  this.wallet = this.wallet || { balance: 0, currency: "PHP", transactions: [] };
  if ((this.wallet.balance || 0) < amount) throw new Error("Insufficient wallet balance");
  this.wallet.balance = (this.wallet.balance || 0) - amount;
  this.wallet.transactions.push({ type, amount: -amount, meta });
  await this.save();
  return this.wallet;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
