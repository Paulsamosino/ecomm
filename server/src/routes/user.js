const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// Get user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send user profile data
    res.json({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      addresses: user.addresses || [],
      preferences: user.preferences || {
        emailNotifications: true,
        orderUpdates: true,
        promotions: true,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Update user profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Get user addresses
router.get("/addresses", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.addresses || []);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Error fetching addresses" });
  }
});

// Add new address
router.post("/addresses", protect, async (req, res) => {
  try {
    const { street, city, state, zipCode, country, phone, isDefault } =
      req.body;

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If this is set as default, unset other default addresses
    if (isDefault && user.addresses) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    const newAddress = {
      street: street || "",
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
      country: country || "",
      phone: phone || "",
      isDefault: isDefault || false,
    };

    if (!user.addresses) {
      user.addresses = [];
    }
    user.addresses.push(newAddress);

    await user.save();

    res.json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Error adding address" });
  }
});

// Delete address
router.delete("/addresses/:addressId", protect, async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.addresses) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Remove address
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== addressId
    );
    await user.save();

    res.json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Error deleting address" });
  }
});

// Get user preferences
router.get("/preferences", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(
      user.preferences || {
        emailNotifications: true,
        orderUpdates: true,
        promotions: true,
      }
    );
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ message: "Error fetching preferences" });
  }
});

// Update user preferences
router.put("/preferences", protect, async (req, res) => {
  try {
    const { emailNotifications, orderUpdates, promotions } = req.body;

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update preferences
    user.preferences = {
      emailNotifications:
        emailNotifications !== undefined ? emailNotifications : true,
      orderUpdates: orderUpdates !== undefined ? orderUpdates : true,
      promotions: promotions !== undefined ? promotions : true,
    };

    await user.save();

    res.json({
      message: "Preferences updated successfully",
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ message: "Error updating preferences" });
  }
});

module.exports = router;
