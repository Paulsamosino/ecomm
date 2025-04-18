const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Register user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, isSeller, sellerProfile } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields",
        missingFields: {
          name: !name,
          email: !email,
          password: !password,
        },
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Create user with seller profile if isSeller is true
    const userData = {
      name,
      email,
      password,
      isSeller: isSeller || false,
    };

    if (isSeller) {
      userData.sellerProfile = {
        businessName: sellerProfile?.businessName || "",
        description: sellerProfile?.description || "",
        address: {
          street: sellerProfile?.address?.street || "",
          city: sellerProfile?.address?.city || "",
          state: sellerProfile?.address?.state || "",
          zipCode: sellerProfile?.address?.zipCode || "",
          country: sellerProfile?.address?.country || "",
        },
        phone: sellerProfile?.phone || "",
        rating: 0,
        reviews: [],
      };
    }

    user = new User(userData);
    await user.save();

    // Create token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
        sellerProfile: user.sellerProfile,
      },
    });
  } catch (err) {
    console.error("Registration error details:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(err.errors).map((error) => error.message),
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate field value entered",
        field: Object.keys(err.keyPattern)[0],
      });
    }

    res.status(500).json({
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    console.log("Login attempt:", req.body);

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
        missingFields: {
          email: !email,
          password: !password,
        },
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create token
    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
        sellerProfile: user.sellerProfile,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isSeller: user.isSeller,
      sellerProfile: user.sellerProfile,
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
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

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isSeller: user.isSeller,
      sellerProfile: user.sellerProfile,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Update seller profile
router.put("/seller-profile", auth, async (req, res) => {
  try {
    if (!req.user.isSeller) {
      return res.status(403).json({ message: "User is not a seller" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        sellerProfile: req.body,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
        sellerProfile: user.sellerProfile,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add seller review
router.post("/seller/:id/reviews", auth, async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || !seller.isSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const { rating, comment } = req.body;

    // Check if user has already reviewed
    const alreadyReviewed = seller.sellerProfile.reviews.find(
      (review) => review.user.toString() === req.user._id
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Seller already reviewed" });
    }

    // Add review
    seller.sellerProfile.reviews.push({
      user: req.user._id,
      rating,
      comment,
    });

    // Update seller rating
    seller.sellerProfile.rating = seller.getAverageRating();

    await seller.save();

    res.json({
      success: true,
      reviews: seller.sellerProfile.reviews,
      rating: seller.sellerProfile.rating,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
