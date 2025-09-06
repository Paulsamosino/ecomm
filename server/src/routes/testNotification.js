const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

// Test endpoint to create a notification for testing
router.post("/create-test", protect, async (req, res) => {
  try {
    console.log("🧪 Creating test notification for user:", req.user._id);
    
    const notification = await Notification.createNotification({
      user: req.user._id,
      type: "system",
      title: "Test Notification",
      message: "This is a test notification to verify the real-time system is working!",
      priority: "normal",
      actionUrl: "/buyer-dashboard"
    });

    console.log("🧪 Test notification created:", notification._id);

    res.status(201).json({
      success: true,
      message: "Test notification created successfully",
      notification
    });
  } catch (error) {
    console.error("🧪 Error creating test notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test notification",
      error: error.message
    });
  }
});

module.exports = router;
