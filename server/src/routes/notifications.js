const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

// Get user notifications
router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get notifications for the authenticated user
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('metadata.orderId', 'status totalAmount')
      .populate('metadata.productId', 'name price images')
      .populate('metadata.sellerId', 'name');

    // Get unread count
    const unreadCount = await Notification.countUnread(req.user._id);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        hasMore: notifications.length === limit
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Get unread count only
router.get("/unread-count", protect, async (req, res) => {
  try {
    const unreadCount = await Notification.countUnread(req.user._id);
    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Error fetching unread count" });
  }
});

// Mark notification as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    const unreadCount = await Notification.countUnread(req.user._id);

    res.json({ 
      message: "Notification marked as read",
      unreadCount 
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read" });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", protect, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Error marking all notifications as read" });
  }
});

// Delete notification
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const unreadCount = await Notification.countUnread(req.user._id);

    res.json({ 
      message: "Notification deleted",
      unreadCount 
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Error deleting notification" });
  }
});

// Create notification (for testing or admin use)
router.post("/", protect, async (req, res) => {
  try {
    const { type, title, message, actionUrl, metadata, priority } = req.body;

    const notification = await Notification.createNotification({
      user: req.user._id,
      type,
      title,
      message,
      actionUrl,
      metadata,
      priority
    });

    res.status(201).json({
      message: "Notification created",
      notification
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Error creating notification" });
  }
});

module.exports = router;
