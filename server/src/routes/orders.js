const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Order = require("../models/Order");

// Create a new order
router.post("/", protect, async (req, res) => {
  try {
    const { items, paymentInfo, totalAmount, shippingAddress } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Order must contain at least one item" });
    }

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode ||
      !shippingAddress.country
    ) {
      return res
        .status(400)
        .json({ message: "Complete shipping address is required" });
    }

    if (!paymentInfo || !paymentInfo.transactionId) {
      return res
        .status(400)
        .json({ message: "Payment information is required" });
    }

    // Get the seller ID from the first item (assuming single seller orders)
    const sellerId = items[0]?.seller;
    if (!sellerId) {
      return res
        .status(400)
        .json({ message: "Seller information is required" });
    }

    // Create order items with proper structure
    const orderItems = items.map((item) => ({
      product: item.product,
      seller: item.seller,
      quantity: item.quantity,
      price: item.price,
    }));

    const order = new Order({
      buyer: req.user._id,
      seller: sellerId,
      items: orderItems,
      paymentInfo: {
        method: "credit_card", // PayPal is processed as credit card
        status: "completed", // Payment is already completed at this point
        transactionId: paymentInfo.transactionId,
      },
      status: "pending", // Initial order status
      totalAmount: totalAmount,
      shippingAddress: shippingAddress,
    });

    // Validate the order against the schema
    const validationError = order.validateSync();
    if (validationError) {
      return res.status(400).json({
        message: "Invalid order data",
        errors: Object.values(validationError.errors).map((err) => err.message),
      });
    }

    await order.save();

    // Populate necessary fields for the response
    await order.populate([
      { path: "buyer", select: "name email" },
      { path: "seller", select: "name email" },
      { path: "items.product", select: "name price images" },
    ]);

    res.status(201).json(order);
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

module.exports = router;
