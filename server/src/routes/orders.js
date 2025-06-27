const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const deliveryController = require("../controllers/deliveryController");
const {
  sendOrderConfirmationEmail,
  sendSellerOrderNotification,
  sendOrderStatusUpdate,
} = require("../utils/emailService");

// Create a new order
router.post("/", protect, async (req, res) => {
  try {
    const { items, paymentInfo, totalAmount, shippingAddress } = req.body;

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

    // Get the seller ID from the first item (assuming single seller orders)
    const sellerId = items[0]?.seller;
    if (!sellerId) {
      return res
        .status(400)
        .json({ message: "Seller information is required" });
    }

    // Load seller details for delivery
    const seller = await User.findById(sellerId).populate("address");
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const order = new Order({
      buyer: req.user._id,
      seller: sellerId,
      items: items.map((item) => ({
        product: item.product,
        seller: item.seller,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentInfo: {
        method: paymentInfo.method || "paypal",
        status: "completed",
        transactionId: paymentInfo.transactionId,
        platformFee: totalAmount * 0.02, // 2% platform fee
      },
      status: "pending",
      totalAmount,
      shippingAddress,
    });

    await order.save();

    // Update seller's total sales and stats
    if (seller.sellerProfile) {
      seller.sellerProfile.totalSales =
        (seller.sellerProfile.totalSales || 0) + totalAmount;
      await seller.save();
    }

    // Update buyer's order history
    const buyer = await User.findById(req.user._id);
    if (buyer) {
      buyer.orderHistory = buyer.orderHistory || [];
      buyer.orderHistory.push(order._id);
      await buyer.save();
    }

    // Send confirmation emails
    try {
      await sendOrderConfirmationEmail(order);
      await sendSellerOrderNotification(order);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the order if email fails
    }

    // Automatically create delivery order
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate("buyer", "name phone email")
        .populate("seller", "name phone email address")
        .populate("items.product");

      await deliveryController.autoCreateDelivery(populatedOrder);
    } catch (deliveryError) {
      console.error("Error creating delivery:", deliveryError);
      // Don't fail the order if delivery creation fails
      // It can be retried manually if needed
    }

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order._id,
        status: order.status,
        total: order.totalAmount,
        items: order.items.length,
      },
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
    const order = await Order.findById(req.params.id).populate(
      "seller",
      "name email"
    );

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

    res.json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Error submitting review" });
  }
});

module.exports = router;
