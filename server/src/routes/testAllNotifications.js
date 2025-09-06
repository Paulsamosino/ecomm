const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const NotificationService = require("../services/notificationService");

// Test route to create all notification types
router.post("/test-all", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const testOrderId = "507f1f77bcf86cd799439011"; // Mock order ID
    const testProductId = "507f1f77bcf86cd799439012"; // Mock product ID
    
    const notifications = [];
    
    console.log(`🧪 Testing all notification types for user: ${userId}`);

    // Test Order Notifications
    try {
      const orderNotifications = [
        'order_created',
        'order_confirmed', 
        'order_shipped',
        'order_delivered',
        'order_cancelled',
        'order_refunded'
      ];
      
      for (const type of orderNotifications) {
        const notification = await NotificationService.createOrderNotification(
          userId,
          testOrderId,
          type
        );
        notifications.push({ type: 'order', subtype: type, success: true, id: notification._id });
        console.log(`✅ Created ${type} notification`);
      }
    } catch (error) {
      console.error(`❌ Error creating order notifications:`, error);
      notifications.push({ type: 'order', success: false, error: error.message });
    }

    // Test Payment Notifications
    try {
      const paymentTypes = ['payment_processed', 'payment_failed'];
      
      for (const type of paymentTypes) {
        const notification = await NotificationService.createPaymentNotification(
          userId,
          testOrderId,
          type,
          100.00
        );
        notifications.push({ type: 'payment', subtype: type, success: true, id: notification._id });
        console.log(`✅ Created ${type} notification`);
      }
    } catch (error) {
      console.error(`❌ Error creating payment notifications:`, error);
      notifications.push({ type: 'payment', success: false, error: error.message });
    }

    // Test Delivery Notifications
    try {
      const deliveryStatuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];
      
      for (const status of deliveryStatuses) {
        const notification = await NotificationService.createDeliveryNotification(
          userId,
          testOrderId,
          status,
          `TRACK${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        );
        notifications.push({ type: 'delivery', subtype: status, success: true, id: notification._id });
        console.log(`✅ Created delivery_update notification for ${status}`);
      }
    } catch (error) {
      console.error(`❌ Error creating delivery notifications:`, error);
      notifications.push({ type: 'delivery', success: false, error: error.message });
    }

    // Test Wishlist Notifications
    try {
      const wishlistTypes = ['wishlist_stock', 'wishlist_price_drop'];
      
      for (const type of wishlistTypes) {
        const additionalData = type === 'wishlist_price_drop' ? 
          { discount: 25, oldPrice: 100, newPrice: 75 } : {};
          
        const notification = await NotificationService.createWishlistNotification(
          userId,
          testProductId,
          type,
          'Test Product Name',
          additionalData
        );
        notifications.push({ type: 'wishlist', subtype: type, success: true, id: notification._id });
        console.log(`✅ Created ${type} notification`);
      }
    } catch (error) {
      console.error(`❌ Error creating wishlist notifications:`, error);
      notifications.push({ type: 'wishlist', success: false, error: error.message });
    }

    // Test System Notifications
    try {
      const notification = await NotificationService.createSystemNotification(
        userId,
        "System Test Notification",
        "This is a test system notification to verify functionality.",
        "/test",
        'normal'
      );
      notifications.push({ type: 'system', success: true, id: notification._id });
      console.log(`✅ Created system notification`);
    } catch (error) {
      console.error(`❌ Error creating system notification:`, error);
      notifications.push({ type: 'system', success: false, error: error.message });
    }

    // Test Promotion Notifications
    try {
      const notification = await NotificationService.createPromotionNotification(
        userId,
        "Test Promotion",
        "Special discount available - 50% off all products!",
        "/products",
        50
      );
      notifications.push({ type: 'promotion', success: true, id: notification._id });
      console.log(`✅ Created promotion notification`);
    } catch (error) {
      console.error(`❌ Error creating promotion notification:`, error);
      notifications.push({ type: 'promotion', success: false, error: error.message });
    }

    // Test Review Notifications
    try {
      const notification = await NotificationService.createReviewNotification(
        userId,
        testOrderId,
        'Test Product for Review'
      );
      notifications.push({ type: 'review', success: true, id: notification._id });
      console.log(`✅ Created review notification`);
    } catch (error) {
      console.error(`❌ Error creating review notification:`, error);
      notifications.push({ type: 'review', success: false, error: error.message });
    }

    const successCount = notifications.filter(n => n.success).length;
    const totalCount = notifications.length;

    console.log(`🎉 Test completed: ${successCount}/${totalCount} notification types created successfully`);

    res.json({
      message: `Test completed: ${successCount}/${totalCount} notification types created successfully`,
      notifications,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    });

  } catch (error) {
    console.error("Error in notification test:", error);
    res.status(500).json({
      message: "Error testing notifications",
      error: error.message
    });
  }
});

module.exports = router;
