const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "order_created",
        "order_confirmed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "order_refunded",
        "payment_processed",
        "payment_failed",
        "wishlist_stock",
        "wishlist_price_drop",
        "new_product",
        "promotion",
        "system",
        "review_received",
        "delivery_update"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    metadata: {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      amount: Number,
      discount: Number,
      trackingNumber: String,
      status: String,
      // Additional metadata can be stored here
      extra: mongoose.Schema.Types.Mixed,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    expiresAt: {
      type: Date,
      default: null, // null means no expiration
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    // Check for duplicate notifications to prevent spam
    const duplicateCheck = {
      user: data.user,
      type: data.type,
      message: data.message,
      createdAt: { 
        $gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
      }
    };

    // For order-related notifications, also check metadata
    if (data.metadata?.orderId) {
      duplicateCheck['metadata.orderId'] = data.metadata.orderId;
    }

    const existingNotification = await this.findOne(duplicateCheck);
    if (existingNotification) {
      console.log(`🔄 Duplicate notification prevented for user ${data.user}:`, data.type);
      return existingNotification;
    }

    const notification = new this(data);
    await notification.save();
    
    console.log(`✅ Notification created for user ${data.user}:`, data.type);
    
    // Real-time notification will be handled by the service layer
    // to avoid circular dependencies and ensure proper WebSocket access
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Static method to count unread notifications
notificationSchema.statics.countUnread = async function(userId) {
  return await this.countDocuments({ user: userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
  
  // Note: We'll handle socket emission in the service layer to avoid circular dependencies
  
  return result;
};

module.exports = mongoose.model("Notification", notificationSchema);
