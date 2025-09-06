const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const NotificationService = require("../services/notificationService");

// Get user's wishlist
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "wishlist.product",
      select: "name price images description quantity seller",
      populate: {
        path: "seller",
        select: "name"
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.wishlist || []);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Error fetching wishlist" });
  }
});

// Add product to wishlist
router.post("/add/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product is already in wishlist
    const isAlreadyInWishlist = user.wishlist.some(
      item => item.product.toString() === productId
    );

    if (isAlreadyInWishlist) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add to wishlist
    user.wishlist.push({
      product: productId,
      addedAt: new Date()
    });

    await user.save();

    // Populate the added item for response
    await user.populate({
      path: "wishlist.product",
      select: "name price images description quantity seller",
      populate: {
        path: "seller",
        select: "name"
      }
    });

    const addedItem = user.wishlist[user.wishlist.length - 1];

    res.status(201).json({
      message: "Product added to wishlist successfully",
      item: addedItem
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Error adding product to wishlist" });
  }
});

// Remove product from wishlist
router.delete("/remove/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from wishlist
    const initialLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter(
      item => item.product.toString() !== productId
    );

    if (user.wishlist.length === initialLength) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    await user.save();

    res.json({ message: "Product removed from wishlist successfully" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Error removing product from wishlist" });
  }
});

// Check if product is in user's wishlist
router.get("/check/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isInWishlist = user.wishlist.some(
      item => item.product.toString() === productId
    );

    res.json({ isInWishlist });
  } catch (error) {
    console.error("Error checking wishlist:", error);
    res.status(500).json({ message: "Error checking wishlist" });
  }
});

// Utility function to check and notify users about stock availability
const notifyWishlistStock = async (productId) => {
  try {
    // Find all users who have this product in their wishlist
    const usersWithWishlist = await User.find({
      "wishlist.product": productId
    });

    const product = await Product.findById(productId);
    if (!product || product.quantity <= 0) {
      return;
    }

    // Send notifications to all users
    for (const user of usersWithWishlist) {
      try {
        await NotificationService.createWishlistNotification(
          user._id,
          productId,
          'wishlist_stock',
          product.name
        );
        console.log(`✅ Stock notification sent to user ${user._id} for product ${product.name}`);
      } catch (notificationError) {
        console.error(`❌ Failed to send stock notification to user ${user._id}:`, notificationError);
      }
    }
  } catch (error) {
    console.error("Error in notifyWishlistStock:", error);
  }
};

// Utility function to check and notify users about price drops
const notifyWishlistPriceDrop = async (productId, oldPrice, newPrice) => {
  try {
    if (newPrice >= oldPrice) {
      return; // Not a price drop
    }

    const discountPercentage = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    
    if (discountPercentage < 5) {
      return; // Only notify for significant price drops (5% or more)
    }

    // Find all users who have this product in their wishlist
    const usersWithWishlist = await User.find({
      "wishlist.product": productId
    });

    const product = await Product.findById(productId);
    if (!product) {
      return;
    }

    // Send notifications to all users
    for (const user of usersWithWishlist) {
      try {
        await NotificationService.createWishlistNotification(
          user._id,
          productId,
          'wishlist_price_drop',
          product.name,
          { discount: discountPercentage, oldPrice, newPrice }
        );
        console.log(`✅ Price drop notification sent to user ${user._id} for product ${product.name} (${discountPercentage}% off)`);
      } catch (notificationError) {
        console.error(`❌ Failed to send price drop notification to user ${user._id}:`, notificationError);
      }
    }
  } catch (error) {
    console.error("Error in notifyWishlistPriceDrop:", error);
  }
};

// Export utility functions for use in product routes
router.notifyWishlistStock = notifyWishlistStock;
router.notifyWishlistPriceDrop = notifyWishlistPriceDrop;

module.exports = router;
