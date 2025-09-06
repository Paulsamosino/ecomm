const Notification = require("../models/Notification");
const websocketService = require("./websocketService");

class NotificationService {
  // Helper method to send notification with real-time updates
  static async _createAndEmitNotification(data) {
    try {
      // Create the notification (with built-in duplicate prevention)
      const notification = await Notification.createNotification(data);
      
      // Send real-time notification via WebSocket
      try {
        websocketService.sendNotificationToUser(data.user, notification);
        
        // Update unread count
        const unreadCount = await Notification.countUnread(data.user);
        websocketService.updateUnreadCount(data.user, unreadCount);
        
        console.log(`🔔 Real-time notification sent to user ${data.user}`);
      } catch (wsError) {
        console.warn("Failed to send real-time notification:", wsError.message);
        // Don't fail the notification creation if WebSocket fails
      }
      
      return notification;
    } catch (error) {
      console.error("Error in _createAndEmitNotification:", error);
      throw error;
    }
  }
  // Order-related notifications
  static async createOrderNotification(userId, orderId, type, additionalData = {}) {
    const notificationMap = {
      order_created: {
        title: "Order Created",
        message: `Your order #${orderId.toString().slice(-6)} has been created successfully!`,
        actionUrl: "/buyer-dashboard/purchases"
      },
      order_confirmed: {
        title: "Order Confirmed",
        message: `Your order #${orderId.toString().slice(-6)} has been confirmed by the seller.`,
        actionUrl: "/buyer-dashboard/purchases"
      },
      order_shipped: {
        title: "Order Shipped",
        message: `Your order #${orderId.toString().slice(-6)} has been shipped and is on its way!`,
        actionUrl: "/buyer-dashboard/purchases"
      },
      order_delivered: {
        title: "Order Delivered",
        message: `Your order #${orderId.toString().slice(-6)} has been delivered successfully.`,
        actionUrl: "/buyer-dashboard/purchases"
      },
      order_cancelled: {
        title: "Order Cancelled",
        message: `Your order #${orderId.toString().slice(-6)} has been cancelled.`,
        actionUrl: "/buyer-dashboard/purchases"
      },
      order_refunded: {
        title: "Refund Processed",
        message: `Your refund for order #${orderId.toString().slice(-6)} has been processed.`,
        actionUrl: "/buyer-dashboard/purchases"
      }
    };

    const notificationData = notificationMap[type];
    if (!notificationData) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return await this._createAndEmitNotification({
      user: userId,
      type,
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: notificationData.actionUrl,
      metadata: {
        orderId,
        ...additionalData
      },
      priority: type.includes('cancelled') || type.includes('refunded') ? 'high' : 'normal'
    });
  }

  // Payment notifications
  static async createPaymentNotification(userId, orderId, type, amount) {
    const notificationMap = {
      payment_processed: {
        title: "Payment Successful",
        message: `Your payment of ₱${amount} has been processed successfully.`,
        priority: 'normal'
      },
      payment_failed: {
        title: "Payment Failed",
        message: `Your payment of ₱${amount} could not be processed. Please try again.`,
        priority: 'high'
      }
    };

    const notificationData = notificationMap[type];
    if (!notificationData) {
      throw new Error(`Unknown payment notification type: ${type}`);
    }

    return await this._createAndEmitNotification({
      user: userId,
      type,
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: "/buyer-dashboard/purchases",
      metadata: {
        orderId,
        amount
      },
      priority: notificationData.priority
    });
  }

  // Wishlist notifications
  static async createWishlistNotification(userId, productId, type, productName, additionalData = {}) {
    const notificationMap = {
      wishlist_stock: {
        title: "Item Back in Stock",
        message: `${productName} is now available!`,
        priority: 'normal'
      },
      wishlist_price_drop: {
        title: "Price Drop Alert",
        message: `The price of ${productName} has dropped by ${additionalData.discount}%!`,
        priority: 'normal'
      }
    };

    const notificationData = notificationMap[type];
    if (!notificationData) {
      throw new Error(`Unknown wishlist notification type: ${type}`);
    }

    return await this._createAndEmitNotification({
      user: userId,
      type,
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: `/products/${productId}`,
      metadata: {
        productId,
        ...additionalData
      },
      priority: notificationData.priority
    });
  }

  // Promotion notifications
  static async createPromotionNotification(userId, title, message, actionUrl = "/products", discount = null) {
    return await this._createAndEmitNotification({
      user: userId,
      type: 'promotion',
      title,
      message,
      actionUrl,
      metadata: {
        discount
      },
      priority: 'low'
    });
  }

  // System notifications
  static async createSystemNotification(userId, title, message, actionUrl = null, priority = 'normal') {
    return await this._createAndEmitNotification({
      user: userId,
      type: 'system',
      title,
      message,
      actionUrl,
      priority
    });
  }

  // Review notifications
  static async createReviewNotification(userId, orderId, productName) {
    return await this._createAndEmitNotification({
      user: userId,
      type: 'review_received',
      title: "Review Request",
      message: `Please review your recent purchase: ${productName}`,
      actionUrl: `/buyer-dashboard/purchases`,
      metadata: {
        orderId
      },
      priority: 'low'
    });
  }

  // Delivery notifications
  static async createDeliveryNotification(userId, orderId, status, trackingNumber = null) {
    const statusMessages = {
      'picked_up': 'Your order has been picked up by the delivery partner.',
      'in_transit': 'Your order is in transit.',
      'out_for_delivery': 'Your order is out for delivery.',
      'delivered': 'Your order has been delivered successfully.',
      'failed': 'Delivery attempt failed. The delivery partner will try again.',
      'cancelled': 'Your delivery has been cancelled.'
    };

    const message = statusMessages[status] || `Delivery status updated: ${status}`;

    return await this._createAndEmitNotification({
      user: userId,
      type: 'delivery_update',
      title: "Delivery Update",
      message: trackingNumber ? `${message} Tracking: ${trackingNumber}` : message,
      actionUrl: "/buyer-dashboard/purchases",
      metadata: {
        orderId,
        status,
        trackingNumber
      },
      priority: status === 'delivered' ? 'normal' : 'low'
    });
  }

  // Bulk notification for promotions
  static async createBulkPromotionNotification(userIds, title, message, actionUrl = "/products") {
    const notifications = userIds.map(userId => ({
      user: userId,
      type: 'promotion',
      title,
      message,
      actionUrl,
      priority: 'low'
    }));

    return await Notification.insertMany(notifications);
  }

  // Clean up old notifications (call this periodically)
  static async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result;
  }
}

module.exports = NotificationService;
