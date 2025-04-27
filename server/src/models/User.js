const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
      validate: {
        validator: function (password) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(
            password
          );
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      },
    },
    passwordHistory: [
      {
        password: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    accountLockUntil: { type: Date },
    activeSessions: [String], // JWT IDs of valid sessions
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    sellerProfile: {
      businessName: String,
      description: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      phone: String,
      rating: {
        type: Number,
        default: 0,
      },
      reviews: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          rating: Number,
          comment: String,
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Set isAdmin based on role
userSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    this.isAdmin = this.role === "admin";
  }
  next();
});

// Set isSeller based on role
userSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    this.isSeller = this.role === "seller";
  }
  next();
});

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  // Store old password in history
  if (this.password) {
    const maxHistorySize = 5;
    this.passwordHistory = this.passwordHistory || [];

    // Add current password to history
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.passwordHistory.unshift({
      password: hashedPassword,
      changedAt: new Date(),
    });

    // Trim history to max size
    if (this.passwordHistory.length > maxHistorySize) {
      this.passwordHistory = this.passwordHistory.slice(0, maxHistorySize);
    }
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  this.updatedAt = new Date();
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      jti: require("uuid").v4(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "24h",
      algorithm: "HS256",
    }
  );
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return this.accountLockUntil && this.accountLockUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  // Reset attempts if lock has expired
  if (this.accountLockUntil && this.accountLockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.accountLockUntil = null;
    await this.save();
    return;
  }

  // Otherwise increment
  this.loginAttempts += 1;

  // Lock account if too many attempts
  if (this.loginAttempts >= 5) {
    this.accountLockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }

  await this.save();
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.accountLockUntil = null;
  this.lastLogin = new Date();
  await this.save();
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate average rating
userSchema.methods.getAverageRating = function () {
  if (this.sellerProfile.reviews.length === 0) return 0;

  const sum = this.sellerProfile.reviews.reduce(
    (acc, review) => acc + review.rating,
    0
  );
  return sum / this.sellerProfile.reviews.length;
};

// Add indexes for better query performance and security
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isSeller: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ accountLockUntil: 1 });
userSchema.index({ "sellerProfile.rating": 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ loginAttempts: 1 });

// Add compound indexes for common queries
userSchema.index({ isSeller: 1, status: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ email: 1, status: 1 });

// Add text index for search
userSchema.index(
  {
    name: "text",
    email: "text",
    "sellerProfile.businessName": "text",
    "sellerProfile.description": "text",
  },
  {
    weights: {
      name: 10,
      email: 5,
      "sellerProfile.businessName": 3,
      "sellerProfile.description": 1,
    },
    name: "UserTextIndex",
  }
);

// Add TTL index for password reset tokens
userSchema.index({ resetPasswordExpire: 1 }, { expireAfterSeconds: 0 });

// Validate password history
userSchema.methods.isPasswordInHistory = async function (password) {
  for (const historical of this.passwordHistory) {
    if (await bcrypt.compare(password, historical.password)) {
      return true;
    }
  }
  return false;
};

// Check if account needs password reset
userSchema.methods.needsPasswordReset = function () {
  const MAX_PASSWORD_AGE = 90 * 24 * 60 * 60 * 1000; // 90 days
  if (!this.passwordHistory?.length) return false;

  const lastPasswordChange = this.passwordHistory[0].changedAt;
  return Date.now() - lastPasswordChange > MAX_PASSWORD_AGE;
};

const User = mongoose.model("User", userSchema);

// Ensure indexes are created
User.ensureIndexes().catch((err) => {
  console.error("Error creating indexes:", err);
});

module.exports = User;
