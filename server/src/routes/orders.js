const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const deliveryController = require("../controllers/deliveryController");
const NotificationService = require("../services/notificationService");
const {
  sendOrderConfirmationEmail,
  sendSellerOrderNotification,
  sendOrderStatusUpdate,
} = require("../utils/emailService");
const {
  sendPurchaseNotification,
  sendOrderStatusUpdate: sendOrderStatusSMS
} = require("../utils/smsService");

// Create a new order
router.post("/", protect, async (req, res) => {
  try {
    const { items, paymentInfo, totalAmount, shippingAddress, delivery } = req.body;

    // Validate required fields
    if (!items?.length) {
      return res
        .status(400)
        .json({ message: "Order must contain at least one item" });
    }

    if (
      !shippingAddress?.street ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.zipCode ||
      !shippingAddress?.country ||
      !shippingAddress?.phone
    ) {
      return res
        .status(400)
        .json({ message: "Complete shipping address is required" });
    }

    if (!paymentInfo?.transactionId) {
      return res
        .status(400)
        .json({ message: "Payment information is required" });
    }

    // Verify stock availability before creating order
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.product} not found` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
        });
      }
    }

    // Group items by seller to create separate orders for each seller
    const itemsBySeller = {};
    
    for (const item of items) {
      const sellerId = item.seller;
      if (!sellerId) {
        return res.status(400).json({ 
          message: "All items must have seller information" 
        });
      }
      
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      itemsBySeller[sellerId].push(item);
    }

    console.log(`📦 Creating orders for ${Object.keys(itemsBySeller).length} seller(s)`);

    const createdOrders = [];
    const orderResponses = [];

    // Create separate orders for each seller
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      try {
        console.log(`👤 Processing order for seller: ${sellerId} with ${sellerItems.length} items`);

        // Load seller details for delivery
        const seller = await User.findById(sellerId)
          .populate("address")
          .populate("sellerProfile.location");
        
        if (!seller) {
          console.error(`Seller ${sellerId} not found`);
          return res.status(404).json({ message: `Seller ${sellerId} not found` });
        }

        // Calculate total for this seller's items
        const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Calculate proportional platform fee based on this seller's total
        const sellerPlatformFee = (sellerTotal / totalAmount) * (totalAmount * 0.02);

        // Build items with snapshot of warranty fields
        const itemsWithWarranty = [];
        for (const item of sellerItems) {
          const prod = await Product.findById(item.product);
          itemsWithWarranty.push({
            product: item.product,
            seller: item.seller,
            quantity: item.quantity,
            price: item.price,
            warrantyPeriod: prod ? prod.warrantyPeriod || "" : "",
            warrantyDetails: prod ? prod.warrantyDetails || "" : "",
          });
        }

        const order = new Order({
          buyer: req.user._id,
          seller: sellerId,
          items: itemsWithWarranty,
          paymentInfo: {
            method: paymentInfo.method || "paypal",
            status: paymentInfo.status || "completed",
            transactionId: paymentInfo.transactionId,
            platformFee: sellerPlatformFee,
          },
          delivery: delivery ? {
            status: "pending",
            price: {
              amount: delivery.shippingFee || 0,
              currency: "PHP"
            }
          } : undefined,
          status: "pending",
          totalAmount: sellerTotal,
          shippingAddress,
        });

        await order.save();
        createdOrders.push(order);

        // Note: Individual order notifications moved to consolidated section below

        // Update seller's total sales and stats
        if (seller.sellerProfile) {
          seller.sellerProfile.totalSales =
            (seller.sellerProfile.totalSales || 0) + sellerTotal;
          await seller.save();
        }

        orderResponses.push({
          id: order._id,
          seller: seller.name,
          sellerId: seller._id,
          items: sellerItems.length,
          total: sellerTotal,
          status: order.status
        });

        console.log(`✅ Order created for seller ${seller.name}: ${order._id}`);

      } catch (sellerOrderError) {
        console.error(`❌ Failed to create order for seller ${sellerId}:`, sellerOrderError);
        return res.status(500).json({
          message: `Failed to create order for seller ${sellerId}`,
          error: sellerOrderError.message
        });
      }
    }

    // Update buyer's order history with all created orders
    const buyer = await User.findById(req.user._id);
    if (buyer) {
      buyer.orderHistory = buyer.orderHistory || [];
      for (const order of createdOrders) {
        buyer.orderHistory.push(order._id);
      }
      await buyer.save();
    }

    // Create consolidated notifications for the buyer (prevents duplicates for multi-seller purchases)
    try {
      if (createdOrders.length === 1) {
        // Single seller purchase - create individual notifications
        const order = createdOrders[0];
        
        await NotificationService.createOrderNotification(
          req.user._id,
          order._id,
          'order_created'
        );
        console.log(`✅ Order notification created for buyer: ${order._id}`);

        // Create payment notification for non-cash payments
        if (paymentInfo.method !== 'cash') {
          const shippingCost = delivery?.shippingFee || 0;
          const platformFee = order.paymentInfo.platformFee || 0;
          const totalPaidAmount = order.totalAmount + platformFee + shippingCost;
          
          await NotificationService.createPaymentNotification(
            req.user._id,
            order._id,
            'payment_processed',
            totalPaidAmount
          );
          console.log(`✅ Payment notification created for buyer: ${order._id} - ₱${totalPaidAmount}`);
        }
      } else {
        // Multi-seller purchase - create consolidated notifications
        const totalItems = createdOrders.reduce((sum, order) => sum + order.items.length, 0);
        const sellerNames = createdOrders.map(order => order.seller.toString()).slice(0, 2); // Limit to first 2 sellers
        const sellerCount = createdOrders.length;
        
        // Create consolidated order notification
        const consolidatedOrderMessage = `Your order with ${totalItems} items from ${sellerCount} seller${sellerCount > 1 ? 's' : ''} has been confirmed.`;
        await NotificationService.createSystemNotification(
          req.user._id,
          "Orders Confirmed",
          consolidatedOrderMessage,
          `/buyer-dashboard/orders`,
          'normal'
        );
        console.log(`✅ Consolidated order notification created for buyer: ${sellerCount} orders`);

        // Create consolidated payment notification for non-cash payments
        if (paymentInfo.method !== 'cash') {
          const shippingCost = delivery?.shippingFee || 0;
          const totalPlatformFees = createdOrders.reduce((sum, order) => sum + (order.paymentInfo.platformFee || 0), 0);
          const totalPaidAmount = totalAmount + totalPlatformFees + shippingCost;
          
          await NotificationService.createSystemNotification(
            req.user._id,
            "Payment Processed",
            `Payment of ₱${totalPaidAmount.toFixed(2)} processed successfully for your ${sellerCount} order${sellerCount > 1 ? 's' : ''}.`,
            `/buyer-dashboard/orders`,
            'normal'
          );
          console.log(`✅ Consolidated payment notification created for buyer: ₱${totalPaidAmount} for ${sellerCount} orders`);
        }
      }
    } catch (notificationError) {
      console.error(`❌ Failed to create consolidated notifications:`, notificationError);
      // Don't fail the order creation if notification fails
    }

    // Process each order for emails and delivery
    for (const order of createdOrders) {
      try {
        // Populate order with buyer, seller, and product information for emails and delivery
        const populatedOrder = await Order.findById(order._id)
          .populate("buyer", "name phone email")
          .populate({
            path: "seller", 
            select: "name phone email address sellerProfile",
            populate: {
              path: "sellerProfile.location",
              select: "street city state zipCode country phone"
            }
          })
          .populate("items.product");

        // Debug logging for delivery creation
        console.log(`🚚 Preparing delivery for order: ${order._id} (Seller: ${populatedOrder.seller?.name})`);
        console.log("📦 Order details:", {
          buyer: populatedOrder.buyer?.name,
          seller: populatedOrder.seller?.name,
          sellerProfile: populatedOrder.seller?.sellerProfile ? 'Present' : 'Missing',
          sellerLocation: populatedOrder.seller?.sellerProfile?.location ? 'Present' : 'Missing',
          shippingAddress: populatedOrder.shippingAddress ? 'Present' : 'Missing'
        });

        // Send confirmation emails
        console.log(`📧 Attempting to send confirmation emails for order: ${order._id}`);
        try {
          console.log("📤 Sending buyer confirmation email...");
          await sendOrderConfirmationEmail(populatedOrder);
          console.log("📤 Sending seller notification email...");
          await sendSellerOrderNotification(populatedOrder);
          console.log("✅ Both confirmation emails sent successfully");
        } catch (emailError) {
          console.error("❌ Error sending confirmation email:", emailError);
          console.error("Email error stack:", emailError.stack);
          // Don't fail the order if email fails
        }

        // Send SMS notifications
        console.log(`📱 Attempting to send SMS notifications for order: ${order._id}`);
        try {
          // Send SMS to seller - get phone from seller profile
          const sellerPhone = populatedOrder.seller?.sellerProfile?.location?.phone;
          if (sellerPhone) {
            console.log("📱 Sending seller SMS notification...");
            const smsResult = await sendPurchaseNotification(sellerPhone, populatedOrder);
            console.log("📱 Seller SMS notification result:", smsResult);
          } else {
            console.log("⚠️ Seller phone number not found in profile - skipping seller SMS");
          }
          
          // You can also send SMS to buyer if they have a phone number
          const buyerPhone = populatedOrder.shippingAddress?.phone;
          if (buyerPhone) {
            console.log("📱 Sending buyer SMS confirmation...");
            const buyerSmsResult = await sendOrderStatusSMS(buyerPhone, populatedOrder, 'confirmed');
            console.log("📱 Buyer SMS confirmation result:", buyerSmsResult);
          } else {
            console.log("⚠️ Buyer phone number not available - skipping buyer SMS");
          }
          
          console.log("✅ SMS notifications completed");
        } catch (smsError) {
          console.error("❌ Error sending SMS notifications:", smsError);
          console.error("SMS error stack:", smsError.stack);
          // Don't fail the order if SMS fails
        }

        // Automatically create delivery order with enhanced logging
        console.log(`🚚 Starting automatic delivery creation for order ${order._id}...`);
        try {
          const deliveryResult = await deliveryController.autoCreateDelivery(populatedOrder);
          if (deliveryResult) {
            console.log(`✅ Delivery created successfully for order ${order._id}:`, deliveryResult.id);
          } else {
            console.warn(`⚠️ Delivery creation returned null for order ${order._id} (likely config issue)`);
          }
        } catch (deliveryError) {
          console.error(`❌ Error creating delivery for order ${order._id}:`, deliveryError);
          console.error("Delivery error details:", {
            message: deliveryError.message,
            stack: deliveryError.stack,
            orderId: order._id,
            seller: populatedOrder.seller?.name
          });
          // Don't fail the order if delivery creation fails
          // It can be retried manually if needed
        }

      } catch (processingError) {
        console.error(`❌ Error processing order ${order._id}:`, processingError);
        // Continue processing other orders even if one fails
      }
    }

    res.status(201).json({
      message: `Orders created successfully for ${createdOrders.length} seller(s)`,
      orders: orderResponses,
      totalOrders: createdOrders.length,
      grandTotal: totalAmount,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// Get buyer's orders
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("items.product")
      .populate("items.seller", "name email")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Get order details
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("items.product", "name price images");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user has permission to view this order
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.seller._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order details" });
  }
});

// Update order status (seller only)
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify seller owns this order
    if (order.seller._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this order" });
    }

    // Update order details
    order.status = status;
    if (notes) order.notes = notes;

    try {
      await order.save();
    } catch (error) {
      if (error.message.includes("Invalid status transition")) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }

    // Send status update email to buyer
    try {
      await sendOrderStatusUpdate(order);
    } catch (emailError) {
      console.error("Error sending status update email:", emailError);
      // Don't fail the update if email fails
    }

    // Create status update notification for buyer
    try {
      const notificationTypes = {
        'processing': 'order_confirmed',
        'shipped': 'order_shipped',
        'delivered': 'order_delivered',
        'cancelled': 'order_cancelled'
      };

      const notificationType = notificationTypes[status];
      if (notificationType) {
        await NotificationService.createOrderNotification(
          order.buyer._id,
          order._id,
          notificationType
        );
        console.log(`✅ Status notification created for buyer: ${order._id} - ${status}`);
      }
    } catch (notificationError) {
      console.error("Error creating status notification:", notificationError);
      // Don't fail the update if notification fails
    }

    // Send payment notification for cash orders only when completed
    if (order.paymentInfo.method === 'cash' && status === 'completed') {
      try {
        // Calculate total paid amount including platform fee and shipping for cash orders
        const shippingCost = order.delivery?.price?.amount || 0;
        const platformFee = order.paymentInfo.platformFee || 0;
        const totalPaidAmount = order.totalAmount + platformFee + shippingCost;
        
        await NotificationService.createPaymentNotification(
          order.buyer._id,
          order._id,
          'payment_processed',
          totalPaidAmount
        );
        console.log(`✅ Cash payment notification created for buyer: ${order._id} - ₱${totalPaidAmount} (Order: ₱${order.totalAmount} + Platform Fee: ₱${platformFee} + Shipping: ₱${shippingCost})`);
      } catch (notificationError) {
        console.error(`❌ Failed to create cash payment notification:`, notificationError);
        // Don't fail the update if notification fails
      }
    }

    // Send SMS status update to buyer
    try {
      const buyerPhone = order.shippingAddress?.phone;
      if (buyerPhone) {
        console.log(`📱 Sending status update SMS to buyer: ${buyerPhone}`);
        const smsResult = await sendOrderStatusSMS(buyerPhone, order, status);
        console.log("📱 Buyer SMS status update result:", smsResult);
      } else {
        console.log("⚠️ Buyer phone number not available - skipping status SMS");
      }
    } catch (smsError) {
      console.error("❌ Error sending status update SMS:", smsError);
      // Don't fail the update if SMS fails
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
});

// Process refund
router.post("/:id/refund", protect, async (req, res) => {
  try {
    const { refundId, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify seller owns this order
    if (order.seller.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to refund this order" });
    }

    await order.refund(refundId);

    // Create refund notification for buyer
    try {
      await NotificationService.createOrderNotification(
        order.buyer._id,
        order._id,
        'order_refunded'
      );
      console.log(`✅ Refund notification created for buyer: ${order._id}`);
    } catch (notificationError) {
      console.error(`❌ Failed to create refund notification:`, notificationError);
      // Don't fail the refund if notification fails
    }

    // Cancel delivery if exists
    if (order.delivery?.lalamoveOrderId) {
      try {
        await deliveryController.cancelDelivery(order._id);
      } catch (deliveryError) {
        console.error("Error cancelling delivery:", deliveryError);
      }
    }

    // Add refund reason to notes
    order.notes = `Refunded: ${reason}`;
    await order.save();

    res.json({ message: "Refund processed successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error processing refund" });
  }
});

// Add review to order
router.post("/:id/review", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("seller", "name email")
      .populate("items.product", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify buyer owns this order
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to review this order" });
    }

    // Add review using the new method
    try {
      await order.createReview({ rating, comment });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Send review notification to seller
    try {
      const productNames = order.items.map(item => item.product.name).join(", ");
      await NotificationService.createSystemNotification(
        order.seller._id,
        "New Review Received",
        `You received a ${rating}-star review for: ${productNames}`,
        `/seller-dashboard/reviews`,
        'normal'
      );
      console.log(`✅ Review notification sent to seller: ${order.seller._id}`);
    } catch (notificationError) {
      console.error(`❌ Failed to send review notification:`, notificationError);
      // Don't fail the review submission if notification fails
    }

    res.json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Error submitting review" });
  }
});

module.exports = router;
