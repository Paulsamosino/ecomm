const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const sanitize = require("mongo-sanitize");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");

// In-memory token blacklist with TTL
const tokenBlacklist = new Map();
const BLACKLIST_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean up expired tokens from blacklist
setInterval(() => {
  const now = Date.now();
  for (const [token, timestamp] of tokenBlacklist) {
    if (now - timestamp > BLACKLIST_TTL) {
      tokenBlacklist.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Rate limiting configuration
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password validation
const PASSWORD_RULES = {
  minLength: 8,
  requireNumbers: true,
  requireSymbols: true,
  requireUppercase: true,
};

const validatePassword = (password) => {
  const errors = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_RULES.minLength} characters long`
    );
  }
  if (PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (PASSWORD_RULES.requireSymbols && !/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  return errors;
};

// Response messages
const MESSAGES = {
  MISSING_FIELDS: "Please provide all required fields",
  INVALID_EMAIL: "Please provide a valid email address",
  INVALID_PASSWORD: "Password must be at least 6 characters long",
  USER_EXISTS: "User already exists with this email",
  INVALID_CREDENTIALS: "Invalid credentials",
  SERVER_ERROR: "Server error",
  USER_NOT_FOUND: "User not found",
  NOT_SELLER: "User is not a seller",
  ALREADY_REVIEWED: "Seller already reviewed",
};

// Helper functions
const createJwtToken = (userId) => {
  const jwtId = uuidv4();
  const token = jwt.sign(
    {
      id: userId,
      jti: jwtId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "24h",
      algorithm: "HS256",
    }
  );
  return { token, jwtId };
};

// Blacklist a token
const blacklistToken = (token) => {
  tokenBlacklist.set(token, Date.now());
};

// Check if token is blacklisted
exports.isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

const formatUserResponse = (user, token = null) => {
  const response = {
    id: user._id,
    name: user.name,
    email: user.email,
    isSeller: user.isSeller,
    isAdmin: user.role === "admin",
    sellerProfile: user.sellerProfile,
  };

  if (token) {
    response.token = token;
  }

  return response;
};

const validateRegistration = (name, email, password) => {
  const errors = {};

  if (!name) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";
  if (!password) errors.password = "Password is required";

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      errors: { email: MESSAGES.INVALID_EMAIL },
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      errors: { password: MESSAGES.INVALID_PASSWORD },
    };
  }

  return { isValid: true };
};

// Controller methods
exports.register = async (req, res) => {
  try {
    const { name, email, password, isSeller, sellerProfile } = req.body;

    // Validate input
    const validation = validateRegistration(name, email, password);
    if (!validation.isValid) {
      return res.status(400).json({
        message: MESSAGES.MISSING_FIELDS,
        errors: validation.errors,
      });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitize(email.toLowerCase().trim());
    const sanitizedName = sanitize(name.trim());

    // Check existing user
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: MESSAGES.USER_EXISTS });
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: MESSAGES.INVALID_PASSWORD,
        errors: passwordErrors,
      });
    }

    // Prepare user registration data
    const registrationData = {
      name: sanitizedName,
      email: sanitizedEmail,
      password,
      isSeller: isSeller || false,
      lastLogin: new Date(),
      loginAttempts: 0,
    };

    if (isSeller && sellerProfile) {
      registrationData.sellerProfile = {
        businessName: sellerProfile.businessName || "",
        description: sellerProfile.description || "",
        address: {
          street: sellerProfile.address?.street || "",
          city: sellerProfile.address?.city || "",
          state: sellerProfile.address?.state || "",
          zipCode: sellerProfile.address?.zipCode || "",
          country: sellerProfile.address?.country || "",
        },
        phone: sellerProfile.phone || "",
        rating: 0,
        reviews: [],
      };
    }

    // Create user
    const user = await User.create(registrationData);
    const { token, jwtId } = createJwtToken(user._id);

    // Update user's last login
    await User.findByIdAndUpdate(user._id, {
      $set: { lastLogin: new Date() },
      $push: { activeSessions: jwtId },
    });

    const formattedUser = formatUserResponse(user);
    res.status(201).json({
      success: true,
      user: formattedUser,
      token: token,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(err.errors).map((error) => error.message),
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        message: MESSAGES.USER_EXISTS,
      });
    }

    res.status(500).json({ message: MESSAGES.SERVER_ERROR });
  }
};

exports.login = async (req, res) => {
  try {
    // Log login attempt (without credentials)
    console.log(
      "Login attempt for email:",
      req.body.email ? req.body.email.substring(0, 3) + "..." : "not provided"
    );

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: MESSAGES.MISSING_FIELDS,
        errors: {
          email: !email ? "Email is required" : undefined,
          password: !password ? "Password is required" : undefined,
        },
      });
    }

    const sanitizedEmail = sanitize(email.toLowerCase().trim());
    console.log(
      "Finding user with email:",
      sanitizedEmail.substring(0, 3) + "..."
    );

    try {
      // Find user and explicitly select password and loginAttempts fields
      const user = await User.findOne({ email: sanitizedEmail })
        .select("+password +loginAttempts")
        .exec()
        .catch((err) => {
          console.error("Database query error:", err);
          throw new Error("Database query failed");
        });

      if (!user) {
        console.log("No user found with the provided email");
        return res.status(401).json({
          message: MESSAGES.INVALID_CREDENTIALS,
        });
      }

      if (!user.password) {
        console.error("Password field not loaded");
        return res.status(500).json({
          message: "Server configuration error",
        });
      }

      console.log("User found, checking password");
      try {
        const passwordMatch = await user.matchPassword(password);

        if (!passwordMatch) {
          console.log("Password does not match");
          await user.incrementLoginAttempts();
          return res.status(401).json({
            message: MESSAGES.INVALID_CREDENTIALS,
          });
        }
      } catch (err) {
        console.error("Password comparison error:", err);
        return res.status(500).json({
          message: "Error verifying credentials",
        });
      }

      // Reset login attempts on successful login
      // Use updateOne to bypass schema validation
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            loginAttempts: 0,
            lastLogin: new Date(),
          },
        }
      );

      const { token, jwtId } = createJwtToken(user._id);

      // Add session
      await User.findByIdAndUpdate(user._id, {
        $push: { activeSessions: jwtId },
      });

      console.log("Login successful for user ID:", user._id);

      const userData = formatUserResponse(user);
      res.json({
        success: true,
        user: userData,
        token: token,
      });
    } catch (err) {
      console.error("Database error during login:", err.message);
      throw err; // Rethrow to be caught by outer try/catch
    }
  } catch (err) {
    console.error("Login error:", err.message);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: MESSAGES.SERVER_ERROR });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    res.json(formatUserResponse(user));
  } catch (err) {
    console.error(`[Auth Error] getCurrentUser: ${err.message}`, {
      userId: req.user?._id,
      error: err,
    });
    res.status(500).json({ message: MESSAGES.SERVER_ERROR });
  }
};

// Logout endpoint
exports.logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      // Blacklist the token
      blacklistToken(token);

      // Remove session from user's active sessions
      if (req.user?._id) {
        const decoded = jwt.decode(token);
        await User.findByIdAndUpdate(req.user._id, {
          $pull: { activeSessions: decoded.jti },
        });
      }
    }

    res.json({ message: "Successfully logged out" });
  } catch (err) {
    console.error(`[Auth Error] logout: ${err.message}`, {
      userId: req.user?._id,
      error: err,
    });
    res.status(500).json({ message: MESSAGES.SERVER_ERROR });
  }
};

// Apply rate limiter to route
exports.protectLoginRoute = [exports.loginLimiter, exports.login];

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password, sellerProfile } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (sellerProfile && user.isSeller) {
      user.sellerProfile = {
        ...user.sellerProfile,
        ...sellerProfile,
      };
    }

    await user.save();
    res.json(formatUserResponse(user));
  } catch (err) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR });
  }
};

exports.updateSellerProfile = async (req, res) => {
  try {
    if (!req.user.isSeller) {
      return res.status(403).json({ message: MESSAGES.NOT_SELLER });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { sellerProfile: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      ...formatUserResponse(user),
    });
  } catch (err) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR });
  }
};

exports.addSellerReview = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller || !seller.isSeller) {
      return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    const alreadyReviewed = seller.sellerProfile.reviews.find(
      (review) => review.user.toString() === req.user._id
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: MESSAGES.ALREADY_REVIEWED });
    }

    const { rating, comment } = req.body;
    seller.sellerProfile.reviews.push({
      user: req.user._id,
      rating,
      comment,
    });

    seller.sellerProfile.rating = seller.getAverageRating();
    await seller.save();

    res.json({
      success: true,
      reviews: seller.sellerProfile.reviews,
      rating: seller.sellerProfile.rating,
    });
  } catch (err) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR });
  }
};
